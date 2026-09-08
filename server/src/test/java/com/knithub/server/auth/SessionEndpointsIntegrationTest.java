package com.knithub.server.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knithub.server.domain.User;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.file.Path;
import java.util.List;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * FT-01-US-03/04 集成测试：会话恢复（GET /auth/me）与登出（POST /auth/logout）。
 *
 * <p>覆盖：有效会话恢复用户（US-03）；无 Cookie / 无效 sid → 401 + 统一提示
 * 「请先登录」；登出销毁服务端会话并下发过期 Cookie（US-04）；登出幂等（未登录
 * 也返回 200，不清除状态视为可接受——任何情况下都允许再次登出）。
 */
@SpringBootTest
@AutoConfigureMockMvc
class SessionEndpointsIntegrationTest {

    @TempDir
    static Path dataDir;

    @DynamicPropertySource
    static void overrideDataDir(DynamicPropertyRegistry registry) {
        registry.add("app.data-dir", () -> dataDir.toAbsolutePath().toString());
    }

    @Autowired
    private MockMvc mockMvc;

    @BeforeAll
    static void seedUsers() throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        List<User> users = List.of(
                user(2L, "woolenwhimsy", encoder.encode("knit123"),
                        "Sarah Chen", "https://example.com/sarah.png", "2021-03-14T00:00:00Z"));
        new ObjectMapper().writeValue(dataDir.resolve("users.json").toFile(), users);
    }

    /**
     * 登录成功并取回 sid Cookie（复用 LoginIntegrationTest 同款种子用户）。
     */
    private Cookie loginAndGetSessionCookie() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"woolenwhimsy\",\"password\":\"knit123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return result.getResponse().getCookie("sid");
    }

    @Test
    void meReturnsCurrentUserForValidSession() throws Exception {
        Cookie sid = loginAndGetSessionCookie();
        mockMvc.perform(get("/api/v1/auth/me").cookie(sid))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.username").value("woolenwhimsy"))
                .andExpect(jsonPath("$.displayName").value("Sarah Chen"))
                .andExpect(jsonPath("$.avatar").value("https://example.com/sarah.png"))
                .andExpect(content().string(not(containsString("password"))));
    }

    @Test
    void meWithoutCookieReturns401WithUnifiedMessage() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("请先登录"));
    }

    @Test
    void meWithUnknownSidReturns401WithUnifiedMessage() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me").cookie(new Cookie("sid", "no-such-session")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("请先登录"));
    }

    @Test
    void logoutDestroysSessionAndClearsCookie() throws Exception {
        Cookie sid = loginAndGetSessionCookie();
        // 登出前：会话有效，me 可恢复用户
        mockMvc.perform(get("/api/v1/auth/me").cookie(sid))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("woolenwhimsy"));
        // 登出：200 + 过期 sid Cookie
        mockMvc.perform(post("/api/v1/auth/logout").cookie(sid))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("已退出"))
                .andExpect(header().string("Set-Cookie", allOf(
                        containsString("sid="),
                        containsString("Max-Age=0"),
                        containsString("HttpOnly"),
                        containsString("SameSite=Lax"))));
        // 同一 sid 已失效：me 回到 401
        mockMvc.perform(get("/api/v1/auth/me").cookie(sid))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("请先登录"));
    }

    @Test
    void logoutWithoutCookieIsIdempotent() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("已退出"));
    }

    private static User user(long id, String username, String passwordHash,
                             String displayName, String avatar, String createdAt) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setPasswordHash(passwordHash);
        user.setDisplayName(displayName);
        user.setAvatar(avatar);
        user.setCreatedAt(createdAt);
        return user;
    }
}
