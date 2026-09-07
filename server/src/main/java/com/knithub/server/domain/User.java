package com.knithub.server.domain;

/**
 * 用户领域实体（PG 兼容，一次到位；技术方案 3.1）。
 *
 * <p>字段清单（存储层 snake_case，与 PG 列名对齐，迁移零改名）：
 * <ul>
 *   <li>id——BIGSERIAL PK，number，自增（Repository 内 max+1）</li>
 *   <li>username——VARCHAR(50) UNIQUE NOT NULL（唯一由代码保证，重复→409）</li>
 *   <li>password_hash——VARCHAR(72) NOT NULL，BCrypt；永不出现在任何 API 响应</li>
 *   <li>display_name——VARCHAR(50) NOT NULL，默认 = username</li>
 *   <li>avatar——VARCHAR(500) NOT NULL，默认占位图 URL</li>
 *   <li>created_at——TIMESTAMPTZ NOT NULL，ISO 8601 字符串</li>
 * </ul>
 *
 * <p>交付阶段：FT-01 阶段 1（技术方案第 4 节）。
 * 实现前必读：AGENTS.md 红线 + FT-01-US-01。
 */
// TODO FT-01: 落地字段与手写 getter/setter（无 Lombok）
public class User {
}
