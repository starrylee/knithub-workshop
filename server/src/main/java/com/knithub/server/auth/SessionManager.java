package com.knithub.server.auth;

/**
 * 内存会话管理器（技术方案 3.5，会话不落盘）。
 *
 * <p>设计要点：
 * <ul>
 *   <li>存储：{@code ConcurrentHashMap<sid, {userId, lastSeen}>}</li>
 *   <li>Cookie {@code sid}：HttpOnly + SameSite=Lax + Max-Age 7 天
 *       （必须设 Max-Age，否则默认会话 Cookie 关浏览器即失效，
 *       违反「重开浏览器不掉登录态」验收口径）</li>
 *   <li>服务重启全部失效（FT-01 决策点 7 已确认可接受）</li>
 *   <li>惰性过期清理；服务端过期策略以 FT-01 待确认决策 2 的裁定为准</li>
 * </ul>
 *
 * <p>交付阶段：FT-01 阶段 2（技术方案第 4 节）。
 * 实现前必读：AGENTS.md 红线 + FT-01-US-02 / US-03。
 */
// TODO FT-01: 会话创建/读取/失效 + 惰性过期清理
public class SessionManager {
}
