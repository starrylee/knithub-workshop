package com.knithub.server.auth;

import com.knithub.server.ServerApplication;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * FT-01-US-03 集成测试：GET /api/v1/auth/me 会话恢复契约。
 *
 * <p>数据取自 seed（server/data/users.json）：woolenwhimsy / knit123（id=2）。
 * 演示账号见 LoginModal；时间类示例数据已由 PO 定级为演示数据（决策 8）。
 */
@SpringBootTest(classes = ServerApplication.class)
@AutoConfigureMockMvc
class AuthMeIntegrationTest {

    /** 独立临时数据目录，复制 seed 的 users.json 后交给 app.data-dir（类加载时完成，先于 Spring 上下文）。 */
    private static final Path DATA_DIR = createSeedDataDir();

    private static Path createSeedDataDir() {
        try {
            Path dir = Files.createTempDirectory("knithub-me-it");
            Path seed = Path.of("data", "users.json");
            if (!Files.exists(seed)) {
                seed = Path.of("../data", "users.json");
            }
            if (!Files.exists(seed)) {
                throw new IllegalStateException("找不到 seed 文件 data/users.json: " + seed.toAbsolutePath());
            }
            Files.copy(seed, dir.resolve("users.json"));
            return dir;
        } catch (Exception e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    @DynamicPropertySource
    static void dataDir(DynamicPropertyRegistry registry) {
        registry.add("app.data-dir", () -> DATA_DIR.toString());
    }

    @Autowired
    private MockMvc mockMvc;

    /** 真实登录拿到 sid Cookie。 */
    private Cookie loginAsWoolenwhimsy() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"woolenwhimsy\",\"password\":\"knit123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        Cookie sid = result.getResponse().getCookie("sid");
        assertNotNull(sid, "登录响应应下发 sid Cookie");
        return sid;
    }

    @Test
    void me返回当前会话用户() throws Exception {
        Cookie sid = loginAsWoolenwhimsy();

        mockMvc.perform(get("/api/v1/auth/me").cookie(sid))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.username").value("woolenwhimsy"))
                .andExpect(jsonPath("$.displayName").value("Sarah Chen"))
                .andExpect(jsonPath("$.avatar").value(
                        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format"))
                // 安全约束：密码哈希永不出现在任何 API 响应
                .andExpect(jsonPath("$.password_hash").doesNotExist());
    }

    @Test
    void me无Cookie返回401游客态() throws Exception {
        // 从未登录过的新访客：不带 sid Cookie → 401，且不返回任何用户数据
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me无效sid返回401游客态() throws Exception {
        // 会话不存在（服务重启后内存会话丢失 / 已登出残留）：伪造 sid → 401，不返回用户数据
        mockMvc.perform(get("/api/v1/auth/me").cookie(new Cookie("sid", "no-such-session")))
                .andExpect(status().isUnauthorized());
    }
}
