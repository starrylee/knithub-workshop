package com.knithub.server.project;

import com.knithub.server.auth.AuthService;
import com.knithub.server.auth.dto.UserResponse;
import com.knithub.server.domain.User;
import com.knithub.server.project.dto.CreateProjectRequest;
import com.knithub.server.project.dto.ProjectResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 项目域接口层（FT-02-US-01 落地）：{@code POST /api/v1/projects} 创建项目。
 *
 * <p>须登录（走 FT-01 的 {@code sid} Cookie）；未登录 → 401 + 统一提示「请先登录」
 * （与 FT-01-US-03 一致，D7）。成功后 201 + 项目 JSON。
 */
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final AuthService authService;

    public ProjectController(ProjectService projectService, AuthService authService) {
        this.projectService = projectService;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<?> create(
            @CookieValue(name = "sid", required = false) String sid,
            @RequestBody CreateProjectRequest request) {
        User user = authService.findUserBySid(sid).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "请先登录"));
        }
        ProjectResponse response = ProjectResponse.from(
                projectService.create(user.getId(), request));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 字段级校验失败 → 400 + {@code {"errors": {field: message}}}（AC-3/AC-4/AC-6）。
     */
    @ExceptionHandler(ProjectValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(ProjectValidationException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errors", e.getErrors()));
    }
}
