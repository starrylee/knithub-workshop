package com.knithub.server.auth;

/**
 * 写操作登录守卫（技术方案第 2 节）：未登录调用受限接口时引导登录
 * （触发机制由 FT-01-US-05 定义）。
 *
 * <p>交付阶段：FT-02 阶段 7 挂载（在 WebConfig 注册）；FT-02/03/04 的受限接口
 * 逐步纳入拦截清单。FT-01 阶段不挂载。
 *
 * <p>实现前必读：AGENTS.md 红线 + FT-01-US-05、FT-02 的 US 文件。
 */
// TODO FT-02: 实现 HandlerInterceptor 并在 WebConfig 注册（含白名单）
public class LoginRequiredInterceptor {
}
