package com.knithub.server.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * 注册请求 DTO（API 报文，camelCase）。
 *
 * <p>交付阶段：FT-01 阶段 3。
 *
 * <p>实现前必读：AGENTS.md 红线 + FT-01-US-01。
 */
public class RegisterRequest {

    @NotBlank
    private String username;

    /**
     * 密码规则（FT-01-US-01 决策 12）：6–20 位，且必须同时包含字母和数字；
     * 其余字符不限制，长度上限 20 亦满足 BCrypt 72 字节约束（20 个中文 = 60 字节）。
     */
    @NotBlank
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{6,20}$", message = "密码需为 6–20 位，且包含字母和数字")
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
