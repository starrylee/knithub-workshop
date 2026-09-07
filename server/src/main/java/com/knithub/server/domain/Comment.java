package com.knithub.server.domain;

/**
 * 留言领域实体（技术方案 3.4，FT-04 数据结构预留——澄清前不实现任何交互）。
 *
 * <p>字段清单（存储层 snake_case）：
 * <ul>
 *   <li>id——BIGSERIAL PK</li>
 *   <li>project_id / user_id——BIGINT NOT NULL FK，留言归属</li>
 *   <li>content——VARCHAR(500) NOT NULL，非空、前端 500 字上限</li>
 *   <li>created_at——TIMESTAMPTZ，留言列表按时间正序（AC9）</li>
 * </ul>
 *
 * <p>交付阶段：FT-04（AskMe 澄清后）。实现前必读：AGENTS.md 红线 3 + FT-04 的 US 文件。
 */
// TODO FT-04: 落地字段
public class Comment {
}
