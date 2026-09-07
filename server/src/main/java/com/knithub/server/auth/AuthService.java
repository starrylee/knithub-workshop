package com.knithub.server.auth;

/**
 * 鉴权业务层：注册（唯一性校验→409）、登录凭据校验（BCrypt）、会话建立与销毁。
 *
 * <p>交付阶段：FT-01 阶段 2~3（技术方案第 4 节）。
 *
 * <p>实现前必读：AGENTS.md 红线 + FT-01 的 US 文件（须为「评估通过」状态）。
 */
// TODO FT-01: 注册/登录/登出业务逻辑（依赖 SessionManager 与 UserRepository）
public class AuthService {
}
