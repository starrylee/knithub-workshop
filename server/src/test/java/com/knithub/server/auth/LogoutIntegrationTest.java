package com.knithub.server.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knithub.server.domain.User;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockCookie;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.file.Path;
import java.util.List;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * FT-01-US-04 登出集成测试（MockMvc + @TempDir 隔离存储）。
 *
 * <p>覆盖 AC：登出成功服务端销毁会话并清除 Cookie（AC-1 的服务端可观测部分——
 * 前端「后端确认成功后才清本地态」的联动由后续 UI 自动化断言）、
 * 登出后旧会话在服务端不残留可用状态（AC-2 服务端等价断言；HTTP 401 口径待
 * 需登录接口随 US-03 me / FT-02 拦截器交付后补）。
 */
@SpringBootTest
@AutoConfigureMockMvc
class LogoutIntegrationTest {

    @TempDir
    static Path dataDir;

    @DynamicPropertySource
    static void overrideDataDir(DynamicPropertyRegistry registry) {
        registry.add("app.data-dir", () -> dataDir.toAbsolutePath().toString());
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SessionManager sessionManager;

    @BeforeAll
    static void seedUsers() throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        List<User> users = List.of(
                user(2L, "woolenwhimsy", encoder.encode("knit123"),
                        "Sarah Chen", "https://example.com/sarah.png", "2021-03-14T00:00:00Z"));
        new ObjectMapper().writeValue(dataDir.resolve("users.json").toFile(), users);
    }

    @Test
    void logoutDestroysServerSessionAndClearsCookie() throws Exception {
        String sid = loginAndGetSid();

        mockMvc.perform(post("/api/v1/auth/logout").cookie(new MockCookie("sid", sid)))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", allOf(
                        containsString("sid="),
                        containsString("Max-Age=0"),
                        containsString("Path=/"))));

        assertTrue(sessionManager.getUserId(sid).isEmpty(),
                "AC-1：登出成功后服务端会话必须销毁，旧 sid 不再解析到任何用户");
    }

    /** 登录 woolenwhimsy，返回响应 Set-Cookie 中的 sid 值。 */
    private String loginAndGetSid() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"woolenwhimsy\",\"password\":\"knit123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String setCookie = result.getResponse().getHeader("Set-Cookie");
        String sid = null;
        for (String part : setCookie.split(";")) {
            String trimmed = part.trim();
            if (trimmed.startsWith("sid=")) {
                sid = trimmed.substring("sid=".length());
            }
        }
        assertTrue(sid != null && !sid.isEmpty(), "登录应下发 sid Cookie");
        return sid;
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
