package com.knithub.server.auth.dto;

import com.knithub.server.domain.User;

/**
 * 用户响应 DTO（API 报文，camelCase；FT-01-US-02）。
 *
 * <p>安全约束：{@code password_hash} 永不出现在任何 API 响应——本类是 User
 * 实体对外暴露的唯一出口，不设密码哈希字段（技术方案 3.1）。
 */
public class UserResponse {

    private final Long id;
    private final String username;
    private final String displayName;
    private final String avatar;

    private UserResponse(Long id, String username, String displayName, String avatar) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.avatar = avatar;
    }

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getAvatar());
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getAvatar() {
        return avatar;
    }
}
