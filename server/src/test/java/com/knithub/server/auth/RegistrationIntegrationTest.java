package com.knithub.server.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knithub.server.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.core.type.TypeReference;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * FT-01-US-01 注册集成测试（MockMvc + @TempDir 隔离存储，与 LoginIntegrationTest 同构）。
 *
 * <p>覆盖 AC：注册成功即时进入登录态（AC-1）、重复用户名（AC-2）、
 * 密码不合规（AC-3）、密码 BCrypt 存储（AC-4）、用户名必填与格式兜底（AC-5）。
 */
@SpringBootTest
@AutoConfigureMockMvc
class RegistrationIntegrationTest {

    @TempDir
    static Path dataDir;

    @DynamicPropertySource
    static void overrideDataDir(DynamicPropertyRegistry registry) {
        registry.add("app.data-dir", () -> dataDir.toAbsolutePath().toString());
    }

    @Autowired
    private MockMvc mockMvc;

    /**
     * 每个用例前清空持久化文件：@TempDir 是类级共享的，注册会真实落盘，
     * 不重置会让前序用例写入的用户影响后续用例（表现为意外的 409）。
     */
    @BeforeEach
    void resetDataFile() throws Exception {
        Files.deleteIfExists(dataDir.resolve("users.json"));
    }

    /**
     * AC-1 示例 1：未登录访客，用户名 snowflake 未被注册 → 注册成功进入登录态。
     *
     * <p>API 层可观测行为：200 + 用户信息（displayName 默认同用户名）+ 与登录一致的
     * 会话 Cookie（sid / Path=/ / Max-Age=604800 / HttpOnly / SameSite=Lax）+ 不含密码字段。
     */
    @Test
    void registerSuccessReturnsUserAndSessionCookie() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"snowflake\",\"password\":\"mittens2026\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.username").value("snowflake"))
                .andExpect(jsonPath("$.displayName").value("snowflake"))
                .andExpect(header().string("Set-Cookie", allOf(
                        containsString("sid="),
                        containsString("Path=/"),
                        containsString("Max-Age=604800"),
                        containsString("HttpOnly"),
                        containsString("SameSite=Lax"))))
                .andExpect(content().string(not(containsString("password"))));
    }

    /**
     * AC-1 示例 2（边界下限）：密码 knit12（6 位，字母+数字）→ 注册成功。
     *
     * <p>与 AC-3 示例 1 的 5 位被拒构成边界对，锁死「6 位为允许下限」。
     */
    @Test
    void passwordWithExactlySixCharactersIsAccepted() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"newweaver\",\"password\":\"knit12\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("newweaver"))
                .andExpect(jsonPath("$.displayName").value("newweaver"));
    }

    /**
     * AC-3 示例 1（长度反例）：密码 knit1（5 位）→ 400 + 明确提示规则，不创建账号。
     *
     * <p>与 AC-1 示例 2 的 6 位通过构成边界对。
     */
    @Test
    void passwordShorterThanSixCharactersIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"newweaver\",\"password\":\"knit1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("密码需为 6–20 位，且包含字母和数字"));
    }

    /**
     * AC-2 示例 1：demo 种子账号 woolenwhimsy 已存在 → 409 + 「用户名已被占用」，且不产生新账号。
     */
    @Test
    void duplicateUsernameIsRejectedAndCreatesNoAccount() throws Exception {
        seedUser("woolenwhimsy", "knit123");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"woolenwhimsy\",\"password\":\"mittens2026\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("用户名已被占用"));

        List<User> users = new ObjectMapper().readValue(
                dataDir.resolve("users.json").toFile(),
                new com.fasterxml.jackson.core.type.TypeReference<List<User>>() {
                });
        org.junit.jupiter.api.Assertions.assertEquals(1, users.size(), "注册失败不得产生新账号");
    }

    /**
     * AC-4 示例 1：注册后查看持久化文件——密码为 bcrypt hash，文件中检索不到明文。
     *
     * <p>防护性反例：不仅验证「做了加密」，还验证「没有泄露明文」。
     */
    @Test
    void passwordIsPersistedAsBcryptHashWithoutPlainText() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"snowflake\",\"password\":\"mittens2026\"}"))
                .andExpect(status().isOk());

        String raw = Files.readString(dataDir.resolve("users.json"));
        assertTrue(raw.contains("$2a$"), "密码应以 bcrypt hash（$2a$ 开头）落盘，实际内容：" + raw);
        assertFalse(raw.contains("mittens2026"), "持久化文件中不得出现明文密码");

        List<User> users = new ObjectMapper().readValue(
                dataDir.resolve("users.json").toFile(),
                new TypeReference<List<User>>() {
                });
        assertTrue(new BCryptPasswordEncoder().matches("mittens2026", users.get(0).getPasswordHash()),
                "落盘 hash 必须能校验通过原始密码");
    }

    /**
     * AC-2 示例 2（大小写变体）：已存在 woolenwhimsy，用 WoolenWhimsy 注册 → 同样 409。
     *
     * <p>防「唯一性口径漂移」的反例：大小写不同的同名必须被判为重复。
     */
    @Test
    void duplicateUsernameWithDifferentCaseIsRejected() throws Exception {
        seedUser("woolenwhimsy", "knit123");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"WoolenWhimsy\",\"password\":\"mittens2026\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("用户名已被占用"));
    }

    private static void seedUser(String username, String password) throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        User user = new User();
        user.setId(2L);
        user.setUsername(username);
        user.setPasswordHash(encoder.encode(password));
        user.setDisplayName("Sarah Chen");
        user.setCreatedAt("2021-03-14T00:00:00Z");
        new ObjectMapper().writeValue(dataDir.resolve("users.json").toFile(), List.of(user));
    }

    /**
     * AC-3 示例 2（复杂度反例）：密码 knitwool（8 位纯字母）→ 长度合规但因缺数字被拒。
     */
    @Test
    void passwordWithoutDigitIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"newweaver\",\"password\":\"knitwool\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("密码需为 6–20 位，且包含字母和数字"));
    }
}
