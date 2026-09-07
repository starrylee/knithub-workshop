package com.knithub.server.domain;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/**
 * 用户领域实体（PG 兼容，一次到位；技术方案 3.1）。
 *
 * <p>存储字段 snake_case（类级 {@code @JsonNaming} 将 passwordHash 映射为
 * {@code password_hash} 等），与未来 PG 列名一次对齐，迁移零改名；
 * TIMESTAMPTZ 以 ISO 8601 字符串承载。
 *
 * <p>安全约束：{@code passwordHash} 永不出现在任何 API 响应——对外暴露
 * 一律经 {@code UserResponse} 转换（技术方案 3.1，FT-01-US-01 AC-4）。
 *
 * <p>实现于 FT-01-US-02（按登录需求落地；写路径随 US-01 注册接入）。
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class User {

    private Long id;
    private String username;
    private String passwordHash;
    private String displayName;
    private String avatar;
    private String createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
