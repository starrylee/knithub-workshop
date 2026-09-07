package com.knithub.server.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 登录请求 DTO（API 报文，camelCase；FT-01-US-02）。
 *
 * <p>仅做非空兜底校验：空输入的必填拦截在前端完成（AC-3，不发请求）；
 * 凭据对错不在本层校验——统一由 Service 判定后 401，防用户名枚举（AC-2）。
 */
public class LoginRequest {

    @NotBlank
    private String username;

    @NotBlank
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
