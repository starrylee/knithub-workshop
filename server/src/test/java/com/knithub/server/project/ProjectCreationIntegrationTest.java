package com.knithub.server.project;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knithub.server.domain.User;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
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

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * FT-02-US-01 创建编织项目——集成测试（MockMvc + @TempDir 隔离存储）。
 *
 * <p>覆盖 AC-1~AC-6 的实例化示例，逐条以红-绿-重构驱动（本文件按示例增量追加，
 * 不在一次提交内写完所有测试）。
 */
@SpringBootTest
@AutoConfigureMockMvc
class ProjectCreationIntegrationTest {

    @TempDir
    static Path dataDir;

    @DynamicPropertySource
    static void overrideDataDir(DynamicPropertyRegistry registry) {
        registry.add("app.data-dir", () -> dataDir.toAbsolutePath().toString());
    }

    @Autowired
    private MockMvc mockMvc;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @BeforeAll
    static void seedUsers() throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        List<User> users = List.of(
                user(2L, "woolenwhimsy", encoder.encode("knit123"),
                        "Sarah Chen", "https://example.com/sarah.png", "2021-03-14T00:00:00Z"));
        MAPPER.writeValue(dataDir.resolve("users.json").toFile(), users);
    }

    /** 每个用例前清空 projects.json，避免用例间落盘状态互相污染（共享 @TempDir）。 */
    @BeforeEach
    void resetProjects() throws Exception {
        MAPPER.writeValue(dataDir.resolve("projects.json").toFile(), List.of());
    }

    private Cookie loginAndGetSessionCookie() throws Exception {
        var result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"woolenwhimsy\",\"password\":\"knit123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return result.getResponse().getCookie("sid");
    }

    /** AC-1 实例化：Iris(woolenwhimsy) 已登录、列表为空 → 新建「祖母的生日披肩」、日期 2026-10-31、不填里程碑 → 201 + 项目 JSON，状态「待开始」 */
    @Test
    void createProjectSuccessReturns201WithProjectBody() throws Exception {
        Cookie sid = loginAndGetSessionCookie();
        String body = "{\"name\":\"祖母的生日披肩\",\"dueDate\":\"2026-10-31\",\"milestones\":[]}";

        mockMvc.perform(post("/api/v1/projects")
                        .cookie(sid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.id").value(org.hamcrest.Matchers.greaterThan(0)))
                .andExpect(jsonPath("$.name").value("祖母的生日披肩"))
                .andExpect(jsonPath("$.dueDate").value("2026-10-31"))
                .andExpect(jsonPath("$.status").value("待开始"))
                .andExpect(jsonPath("$.milestones").isArray())
                .andExpect(jsonPath("$.milestones.length()").value(0));

        // 落盘校验：projects.json 中已写入该项目
        List<Map<String, Object>> stored = MAPPER.readValue(
                dataDir.resolve("projects.json").toFile(), new TypeReference<>() {
                });
        org.junit.jupiter.api.Assertions.assertEquals(1, stored.size());
        org.junit.jupiter.api.Assertions.assertEquals("祖母的生日披肩", stored.get(0).get("name"));
        org.junit.jupiter.api.Assertions.assertEquals("待开始", stored.get(0).get("status"));
    }

    /** AC-2 实例化：Iris 新建「圣诞袜」、日期 2026-12-24，里程碑「织袜筒」(2026-12-01) 与「收口」(无日期) → 201，里程碑按序、均未完成 */
    @Test
    void createProjectWithMilestonesReturnsThemInOrderAndIncomplete() throws Exception {
        Cookie sid = loginAndGetSessionCookie();
        String body = "{\"name\":\"圣诞袜\",\"dueDate\":\"2026-12-24\","
                + "\"milestones\":[{\"name\":\"织袜筒\",\"dueDate\":\"2026-12-01\"},"
                + "{\"name\":\"收口\",\"dueDate\":null}]}";

        mockMvc.perform(post("/api/v1/projects")
                        .cookie(sid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("圣诞袜"))
                .andExpect(jsonPath("$.milestones.length()").value(2))
                .andExpect(jsonPath("$.milestones[0].name").value("织袜筒"))
                .andExpect(jsonPath("$.milestones[0].dueDate").value("2026-12-01"))
                .andExpect(jsonPath("$.milestones[0].completed").value(false))
                .andExpect(jsonPath("$.milestones[1].name").value("收口"))
                .andExpect(jsonPath("$.milestones[1].completed").value(false));

        List<Map<String, Object>> stored = MAPPER.readValue(
                dataDir.resolve("projects.json").toFile(), new TypeReference<>() {
                });
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> storedMs = (List<Map<String, Object>>) stored.get(0).get("milestones");
        org.junit.jupiter.api.Assertions.assertEquals(2, storedMs.size());
        org.junit.jupiter.api.Assertions.assertEquals("织袜筒", storedMs.get(0).get("name"));
        org.junit.jupiter.api.Assertions.assertEquals("收口", storedMs.get(1).get("name"));
    }

    /** AC-3 反例①：名称为空、日期已选 → 400 + 字段提示「请填写项目名称」，且不落盘 */
    @Test
    void createWithBlankNameReturns400AndNoPersist() throws Exception {
        Cookie sid = loginAndGetSessionCookie();
        String body = "{\"name\":\"\",\"dueDate\":\"2026-11-15\",\"milestones\":[]}";

        mockMvc.perform(post("/api/v1/projects")
                        .cookie(sid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").value("请填写项目名称"));

        List<Map<String, Object>> stored = MAPPER.readValue(
                dataDir.resolve("projects.json").toFile(), new TypeReference<>() {
                });
        org.junit.jupiter.api.Assertions.assertTrue(stored.isEmpty(), "非法请求不应创建项目");
    }

    /** AC-3 反例②：名称已填、日期未选 → 400 + 字段提示「请选择预计完成日期」，且不落盘 */
    @Test
    void createWithBlankDueDateReturns400AndNoPersist() throws Exception {
        Cookie sid = loginAndGetSessionCookie();
        String body = "{\"name\":\"围巾\",\"dueDate\":\"\",\"milestones\":[]}";

        mockMvc.perform(post("/api/v1/projects")
                        .cookie(sid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.dueDate").value("请选择预计完成日期"));

        List<Map<String, Object>> stored = MAPPER.readValue(
                dataDir.resolve("projects.json").toFile(), new TypeReference<>() {
                });
        org.junit.jupiter.api.Assertions.assertTrue(stored.isEmpty(), "非法请求不应创建项目");
    }

    /** AC-4：项目名/日期已填，添加 1 条里程碑但名称留空 → 400 + 「里程碑名称必填」，不落盘 */
    @Test
    void createWithBlankMilestoneNameReturns400AndNoPersist() throws Exception {
        Cookie sid = loginAndGetSessionCookie();
        String body = "{\"name\":\"围巾\",\"dueDate\":\"2026-11-15\","
                + "\"milestones\":[{\"name\":\"\",\"dueDate\":\"2026-11-01\"}]}";

        mockMvc.perform(post("/api/v1/projects")
                        .cookie(sid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.milestones").value("里程碑名称必填"));

        List<Map<String, Object>> stored = MAPPER.readValue(
                dataDir.resolve("projects.json").toFile(), new TypeReference<>() {
                });
        org.junit.jupiter.api.Assertions.assertTrue(stored.isEmpty(), "非法请求不应创建项目");
    }

    /** AC-5：未登录（无 sid）直接创建 → 401 + 统一提示「请先登录」，不落盘 */
    @Test
    void createWithoutSessionReturns401() throws Exception {
        String body = "{\"name\":\"围巾\",\"dueDate\":\"2026-11-15\",\"milestones\":[]}";

        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("请先登录"));

        List<Map<String, Object>> stored = MAPPER.readValue(
                dataDir.resolve("projects.json").toFile(), new TypeReference<>() {
                });
        org.junit.jupiter.api.Assertions.assertTrue(stored.isEmpty(), "未登录不应创建项目");
    }

    /** AC-6：名称超 100 字符 → 400 + 「名称不超过100字」，不落盘 */
    @Test
    void createWithTooLongNameReturns400AndNoPersist() throws Exception {
        Cookie sid = loginAndGetSessionCookie();
        String tooLong = "编".repeat(101);
        String body = "{\"name\":\"" + tooLong + "\",\"dueDate\":\"2026-11-15\",\"milestones\":[]}";

        mockMvc.perform(post("/api/v1/projects")
                        .cookie(sid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").value("名称不超过100字"));

        List<Map<String, Object>> stored = MAPPER.readValue(
                dataDir.resolve("projects.json").toFile(), new TypeReference<>() {
                });
        org.junit.jupiter.api.Assertions.assertTrue(stored.isEmpty(), "非法请求不应创建项目");
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
