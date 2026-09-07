package com.knithub.server.repo.json;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;

/**
 * JSON 文件存储通用基座（技术方案 3.6，单 JVM 假设、MVP 单实例）。
 *
 * <p>并发写策略：每文件一把锁串行化写操作；写路径 = 全量读 → 内存修改 →
 * 写同目录 {@code .tmp} → {@code Files.move} 原子替换（防崩溃产生半截 JSON
 * 损坏全量数据）。
 *
 * <p>实现于 FT-01-US-02（读路径支撑登录；写路径随 US-01 注册接入）。
 */
public class JsonFileStore<T> {

    private final Path file;
    private final TypeReference<List<T>> typeReference;
    private final ObjectMapper objectMapper;
    private final Object lock = new Object();

    public JsonFileStore(Path file, TypeReference<List<T>> typeReference, ObjectMapper objectMapper) {
        this.file = file;
        this.typeReference = typeReference;
        this.objectMapper = objectMapper;
    }

    /**
     * 全量读。文件不存在时返回空列表（首启容错；空文件由 WebConfig 启动初始化兜底）。
     */
    public List<T> readAll() {
        synchronized (lock) {
            if (!Files.exists(file)) {
                return new ArrayList<>();
            }
            try (InputStream in = Files.newInputStream(file)) {
                return objectMapper.readValue(in, typeReference);
            } catch (IOException e) {
                throw new UncheckedIOException("读取 JSON 存储失败: " + file, e);
            }
        }
    }

    /**
     * 全量原子写：先写同目录 {@code .tmp}，再原子替换目标文件。
     */
    public void writeAll(List<T> items) {
        synchronized (lock) {
            try {
                if (file.getParent() != null) {
                    Files.createDirectories(file.getParent());
                }
                Path tmp = file.resolveSibling(file.getFileName() + ".tmp");
                objectMapper.writerWithDefaultPrettyPrinter().writeValue(tmp.toFile(), items);
                Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (IOException e) {
                throw new UncheckedIOException("写入 JSON 存储失败: " + file, e);
            }
        }
    }
}
