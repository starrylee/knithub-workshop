package com.knithub.server.auth;

/**
 * 鉴权接口层：register / login / logout / me（技术方案第 2 节，REST /api/v1 前缀）。
 *
 * <p>交付阶段：FT-01 阶段 3（技术方案第 4 节）。参数校验口径：
 * 用户名非空且 ≤50；密码 6~72（72 为 bcrypt 字节上限）；统一错误格式。
 *
 * <p>实现前必读：AGENTS.md 红线 + FT-01 的 US 文件
 * （.asdm/workspace/features/FT-01-账号与鉴权/user_stories/，须为「评估通过」状态）。
 */
// TODO FT-01: 实现 register/login/logout/me 端点
public class AuthController {
}
