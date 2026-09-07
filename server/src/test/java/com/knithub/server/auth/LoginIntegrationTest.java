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
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * FT-01-US-02 登录集成测试（MockMvc + @TempDir 隔离存储，技术方案第 4 节阶段 4）。
 *
 * <p>覆盖 AC：登录成功建立会话（AC-1，含用户名大小写变体——决策 4）、
 * 登录失败统一提示（AC-2，防用户名枚举：密码错误与用户名不存在的响应完全一致）、
 * 空输入后端兜底 400（AC-3 主体为前端必填拦截、不发请求，属人工走查范围）。
 */
@SpringBootTest
@AutoConfigureMockMvc
class LoginIntegrationTest {

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
                        "Sarah Chen", "https://example.com/sarah.png", "2021-03-14T00:00:00Z"),
                user(3L, "threadcountess", encoder.encode("fiber456"),
                        "Emma Rivera", "https://example.com/emma.png", "2020-07-22T00:00:00Z"));
        new ObjectMapper().writeValue(dataDir.resolve("users.json").toFile(), users);
    }

    @Test
    void loginSuccessReturnsUserAndSessionCookie() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"woolenwhimsy\",\"password\":\"knit123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.username").value("woolenwhimsy"))
                .andExpect(jsonPath("$.displayName").value("Sarah Chen"))
                .andExpect(jsonPath("$.avatar").value("https://example.com/sarah.png"))
                .andExpect(header().string("Set-Cookie", allOf(
                        containsString("sid="),
                        containsString("Path=/"),
                        containsString("Max-Age=604800"),
                        containsString("HttpOnly"),
                        containsString("SameSite=Lax"))))
                .andExpect(content().string(not(containsString("password"))));
    }

    @Test
    void loginUsernameMatchIsCaseInsensitive() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"WoolenWhimsy\",\"password\":\"knit123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("woolenwhimsy"))
                .andExpect(jsonPath("$.displayName").value("Sarah Chen"));
    }

    @Test
    void wrongPasswordReturnsUnified401WithoutCookie() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"woolenwhimsy\",\"password\":\"wool456\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("用户名或密码错误"))
                .andReturn();
        assertFalse(result.getResponse().containsHeader("Set-Cookie"));
    }

    @Test
    void unknownUserReturnsIdenticalResponseAsWrongPassword() throws Exception {
        String unknownUser = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"ghostweaver\",\"password\":\"anything123\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String wrongPassword = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"woolenwhimsy\",\"password\":\"wool456\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        assertEquals(wrongPassword, unknownUser, "防用户名枚举：两种失败的响应体必须完全一致");
    }

    @Test
    void blankUsernameOrPasswordRejectedAsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"knit123\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"woolenwhimsy\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    /**
     * 真实种子文件（server/data/users.json）中 woolenwhimsy 的 htpasswd 生成
     * {@code $2y$} 哈希与 BCryptPasswordEncoder 的兼容性锁死——种子 hash 变更
     * 时本用例先于联调失败。
     */
    @Test
    void seedFileBcrypt2yHashIsAccepted() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        assertTrue(encoder.matches("knit123",
                "$2y$10$1raB/cUdOfk0YySd6gMc/u1owgsYWQkfUyFywNBHt101vO9nKeb/a"));
        assertTrue(encoder.matches("fiber456",
                "$2y$10$gxIqWiAxlZ9K0cD588lzPe4uUozBqYvcMOArdjv049CSNK6JC6VyG"));
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
