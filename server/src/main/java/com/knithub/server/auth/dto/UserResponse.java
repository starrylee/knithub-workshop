package com.knithub.server.auth.dto;

/**
 * 用户响应 DTO（API 报文，camelCase）。
 *
 * <p>安全约束：{@code password_hash} 永不出现在任何 API 响应——
 * 本类是 User 实体对外暴露的唯一出口，不设密码哈希字段（技术方案 3.1）。
 *
 * <p>交付阶段：FT-01 阶段 3。
 * 实现前必读：AGENTS.md 红线 + FT-01-US-01 / US-02 / US-03。
 */
// TODO FT-01: 落地 id/username/displayName/avatar 等响应字段
public class UserResponse {
}
