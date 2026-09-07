package com.knithub.server.domain;

/**
 * 项目领域实体（PG 兼容，一次到位；技术方案 3.2），内嵌里程碑列表。
 *
 * <p>字段清单（存储层 snake_case）：
 * <ul>
 *   <li>id——BIGSERIAL PK</li>
 *   <li>user_id——BIGINT NOT NULL FK→users，项目归属（AC1）</li>
 *   <li>name——VARCHAR(100) NOT NULL</li>
 *   <li>due_date——DATE NOT NULL，YYYY-MM-DD</li>
 *   <li>status——VARCHAR(16) NOT NULL：todo / in_progress / on_hold / done（默认 todo；
 *       四栏自由互切，无状态机）</li>
 *   <li>is_public——BOOLEAN NOT NULL DEFAULT FALSE（FT-02 预留 FR-7，FT-04 读写）</li>
 *   <li>milestones——内嵌数组（PG 迁移时拆表 project_milestones；删除项目天然级联）</li>
 *   <li>created_at / last_active_at——TIMESTAMPTZ；last_active_at 建档时 = 创建时间，
 *       为 FT-03 打卡预留接入点（max(最近打卡, 创建)）</li>
 * </ul>
 *
 * <p>交付阶段：FT-02 阶段 7。实现前必读：AGENTS.md 红线 + FT-02 的 US 文件。
 */
// TODO FT-02: 落地字段（含 List<Milestone> milestones 内嵌）与手写 getter/setter（无 Lombok）
public class Project {
}
