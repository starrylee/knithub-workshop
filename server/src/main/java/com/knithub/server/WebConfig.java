package com.knithub.server;

/**
 * 全局 Web 配置：拦截器注册 / 启动初始化（技术方案第 2 节）。
 *
 * <p>交付阶段：
 * <ul>
 *   <li>FT-01：启动初始化——确保 {@code server/data/} 及 4 个 JSON 存储文件存在
 *       （首启自动建空文件，见技术方案 3.6 并发写策略）</li>
 *   <li>FT-02 起：挂载 {@code LoginRequiredInterceptor}（写操作登录守卫）并维护其白名单</li>
 * </ul>
 *
 * <p>实现前必读：AGENTS.md 红线 + 对应 US 文件（.asdm/workspace/features/）。
 */
// TODO FT-01: 启动时初始化 data/ 目录与空 JSON 文件（文件已存在则跳过）
// TODO FT-02: 注册 LoginRequiredInterceptor，排除鉴权白名单端点
public class WebConfig {
}
