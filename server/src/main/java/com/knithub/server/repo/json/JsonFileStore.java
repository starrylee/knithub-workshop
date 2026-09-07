package com.knithub.server.repo.json;

/**
 * JSON 文件存储通用基座（技术方案 3.6，FT-01 决策点 7 遗留设计项）。
 *
 * <p>并发写策略（单 JVM 假设，MVP 单实例）：
 * <ul>
 *   <li>每文件一把锁，串行化写操作</li>
 *   <li>写路径 = 全量读 → 内存修改 → 写 .tmp → Files.move 原子替换
 *       （防崩溃产生半截 JSON 损坏全量数据）</li>
 *   <li>首启自动建空文件（文件不存在则创建空数组）</li>
 * </ul>
 *
 * <p>交付阶段：FT-01 阶段 1（技术方案第 4 节，先于一切 API）。
 * 实现前必读：AGENTS.md 红线 + FT-01-US-01。
 */
// TODO FT-01: 通用读写+锁+原子替换（所有 Json*Repository 复用）
public class JsonFileStore {
}
