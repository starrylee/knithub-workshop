package com.knithub.server.repo;

/**
 * 用户存储接口——Repository 抽象层（技术方案第 1、2 节）。
 *
 * <p>JSON 阶段由 {@code repo/json/JsonUserRepository} 实现；迁移 PG 时仅替换
 * {@code repo/json/} 包内实现，本接口即未来 PG 迁移契约，业务代码只依赖本接口。
 *
 * <p>交付阶段：FT-01 阶段 1（技术方案第 4 节）——Repository 抽象模式首次落地，
 * 后续 FT 复制此模式（ProjectRepository / LikeRepository / CommentRepository 随各 FT 增加）。
 *
 * <p>实现前必读：AGENTS.md 红线 + FT-01-US-01。
 */
// TODO FT-01: 定义最小方法集（save / findByUsername / findById 等，随 US 需要增加，不预发明）
public interface UserRepository {
}
