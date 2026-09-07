package com.knithub.server.domain;

/**
 * 点赞领域实体（技术方案 3.3，FT-04 数据结构预留——澄清前不实现任何交互）。
 *
 * <p>字段清单（存储层 snake_case）：
 * <ul>
 *   <li>id——BIGSERIAL PK</li>
 *   <li>project_id——BIGINT NOT NULL FK</li>
 *   <li>user_id——BIGINT NOT NULL FK，点赞归属（登录用户）</li>
 *   <li>created_at——TIMESTAMPTZ</li>
 * </ul>
 *
 * <p>UNIQUE(project_id, user_id) 由代码保证：每用户每项目最多一赞，
 * 确保点赞数 = 去重人数（AC9 验收不失真）。
 *
 * <p>交付阶段：FT-04（AskMe 澄清后）。实现前必读：AGENTS.md 红线 3 + FT-04 的 US 文件。
 */
// TODO FT-04: 落地字段（toggle 取消等交互规则以 FT-04 AskMe 裁定为准）
public class Like {
}
