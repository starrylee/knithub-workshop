package com.knithub.server.auth;

import com.knithub.server.auth.dto.LoginRequest;
import com.knithub.server.auth.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Map;

/**
 * 鉴权接口层（REST /api/v1 前缀，技术方案第 2 节）。
 *
 * <p>FT-01-US-02 交付：{@code POST /api/v1/auth/login}——成功 200 +
 * UserResponse（camelCase）+ HttpOnly Cookie {@code sid}；凭据错误 401 +
 * 统一提示「用户名或密码错误」（不区分具体哪项错误，防用户名枚举，AC-2）。
 *
 * <p>后续端点随对应 US 交付：register（US-01）、me（US-03）、logout（US-04）。
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    /** Cookie {@code sid} 的 Max-Age：7 天（技术方案 3.5；会话本身无显式过期，决策 2）。 */
    static final Duration SESSION_COOKIE_MAX_AGE = Duration.ofDays(7);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthService.LoginResult result = authService.login(request.getUsername(), request.getPassword());
        ResponseCookie cookie = ResponseCookie.from("sid", result.sid())
                .httpOnly(true)
                .sameSite("Lax")
                .maxAge(SESSION_COOKIE_MAX_AGE)
                .path("/")
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(UserResponse.from(result.user()));
    }

    /**
     * 凭据错误 → 401 + 统一提示（AC-2：用户名不存在与密码错误返回完全一致的响应）。
     */
    @ExceptionHandler(AuthService.InvalidCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleInvalidCredentials(AuthService.InvalidCredentialsException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "用户名或密码错误"));
    }

    /**
     * 会话恢复（FT-01-US-03）：按浏览器携带的 {@code sid} Cookie 反查当前用户。
     *
     * <p>有效会话 → 200 + UserResponse；无/无效会话 → 401（游客态），前端据此
     * 静默进入游客态（刷新/重开浏览器不掉登录态的恢复查询，AC-1/AC-2/AC-3）。
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@CookieValue(name = "sid", required = false) String sid) {
        return authService.findBySession(sid)
                .map(user -> ResponseEntity.ok(UserResponse.from(user)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    // TODO FT-01-US-01: POST /api/v1/auth/register（注册；重复用户名 → 409）
    // TODO FT-01-US-04: POST /api/v1/auth/logout（登出销毁会话）
}
