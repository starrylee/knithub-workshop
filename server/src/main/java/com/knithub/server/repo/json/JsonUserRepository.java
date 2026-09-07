package com.knithub.server.repo.json;

import com.knithub.server.repo.UserRepository;

/**
 * {@link UserRepository} 的 JSON 文件实现（存储：server/data/users.json，
 * 字段 snake_case，与 PG 列名对齐）。
 *
 * <p>职责：自增 id（Repository 内 max+1）、username 唯一查找；
 * 一切约束由代码层保证（技术方案 3.1）。
 *
 * <p>交付阶段：FT-01 阶段 1（技术方案第 4 节）。
 * 实现前必读：AGENTS.md 红线 + FT-01-US-01。
 */
// TODO FT-01: 基于 JsonFileStore 实现 UserRepository
public class JsonUserRepository implements UserRepository {
}
