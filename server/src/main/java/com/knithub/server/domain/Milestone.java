package com.knithub.server.domain;

/**
 * 里程碑领域实体（技术方案 3.2），内嵌于 Project.milestones 数组。
 *
 * <p>字段清单（存储层 snake_case）：
 * <ul>
 *   <li>id——BIGSERIAL PK</li>
 *   <li>name——VARCHAR(100) NOT NULL，必填</li>
 *   <li>due_date——DATE NULL，可选</li>
 *   <li>completed——BOOLEAN DEFAULT FALSE，手动完成（AC6），与打卡次数无关</li>
 *   <li>created_at——TIMESTAMPTZ</li>
 * </ul>
 *
 * <p>数组序 = 创建顺序（FT-02 决策点 8）。
 *
 * <p>交付阶段：FT-02 阶段 7。实现前必读：AGENTS.md 红线 + FT-02-US-04。
 */
// TODO FT-02: 落地字段与手写 getter/setter（无 Lombok）
public class Milestone {
}
