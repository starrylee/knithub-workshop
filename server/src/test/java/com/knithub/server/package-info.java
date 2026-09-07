/**
 * 后端集成测试包（JUnit 5 + Spring Boot Test：MockMvc + @TempDir 隔离存储）。
 *
 * <p>交付阶段：FT-01 阶段 4 起（技术方案第 4 节）：
 * 唯一用户名 409、密码不足 400、登录失败 401、me 会话恢复、登出后 401。
 * 后续 FT 的验收口径各自补集成测试。
 */
package com.knithub.server;
