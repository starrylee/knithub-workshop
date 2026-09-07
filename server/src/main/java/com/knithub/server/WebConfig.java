package com.knithub.server;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * 全局 Web 配置：拦截器注册 / 启动初始化（技术方案第 2 节）。
 *
 * <p>FT-01-US-02 交付：启动时确保数据目录与 4 个 JSON 存储文件存在——
 * 文件不存在则创建空数组（首启自动建空文件，技术方案 3.6；种子文件已随
 * 版本库存在时跳过，不覆盖）。
 *
 * <p>数据目录由 {@code app.data-dir} 配置（默认 {@code data}，即运行时工作
 * 目录下的 server/data/；集成测试以 @TempDir 覆盖）。
 */
@Component
public class WebConfig {

    private final Path dataDir;

    public WebConfig(@Value("${app.data-dir}") String dataDir) {
        this.dataDir = Path.of(dataDir);
    }

    @PostConstruct
    void ensureDataFiles() throws IOException {
        Files.createDirectories(dataDir);
        for (String name : new String[]{"users.json", "projects.json", "likes.json", "comments.json"}) {
            Path file = dataDir.resolve(name);
            if (!Files.exists(file)) {
                Files.writeString(file, "[]\n");
            }
        }
    }

    // TODO FT-02: 注册 LoginRequiredInterceptor（写操作登录守卫），排除鉴权白名单端点
}
