package com.knithub.server.project;

/**
 * 项目域接口层：项目 CRUD、状态四栏切换、里程碑管理（技术方案第 2 节）。
 *
 * <p>交付阶段：FT-02 阶段 7~8。所有写操作须登录（LoginRequiredInterceptor）
 * 且仅能操作本人项目（user_id 归属校验，越权→拒绝）。
 *
 * <p>实现前必读：AGENTS.md 红线 + FT-02 的 US 文件（须为「评估通过」状态，
 * 且 FT-01 已完整交付——红线 4 交付顺序锁）。
 */
// TODO FT-02: 实现项目/里程碑 REST 端点
public class ProjectController {
}
