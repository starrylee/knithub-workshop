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
 * <p>FT-01-US-03 交付：{@code GET /api/v1/auth/me}——按 Cookie {@code sid}
 * 恢复当前登录用户（刷新不掉登录态）；未登录/会话失效 401 + 统一提示
 * 「请先登录」（文案与 FT-02 LoginRequiredInterceptor 保持一致）。
 *
 * <p>FT-01-US-04 交付：{@code POST /api/v1/auth/logout}——销毁服务端会话并
 * 清除 Cookie {@code sid}（幂等，未登录也返回 200）。
 *
 * <p>后续端点随对应 US 交付：register（US-01）。
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
     * FT-01-US-03：会话恢复。Cookie {@code sid} 有效 → 200 + UserResponse；
     * 无 Cookie 或会话已失效 → 401 + 统一提示。
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(@CookieValue(name = "sid", required = false) String sid) {
        return authService.findUserBySid(sid)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(UserResponse.from(user)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "请先登录")));
    }

    /**
     * FT-01-US-04：登出。销毁服务端会话并下发过期 sid Cookie（幂等）。
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@CookieValue(name = "sid", required = false) String sid) {
        authService.logout(sid);
        ResponseCookie cleared = ResponseCookie.from("sid", "")
                .httpOnly(true)
                .sameSite("Lax")
                .maxAge(Duration.ZERO)
                .path("/")
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleared.toString())
                .body(Map.of("message", "已退出"));
    }

    /**
     * 凭据错误 → 401 + 统一提示（AC-2：用户名不存在与密码错误返回完全一致的响应）。
     */
    @ExceptionHandler(AuthService.InvalidCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleInvalidCredentials(AuthService.InvalidCredentialsException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "用户名或密码错误"));
    }

    // TODO FT-01-US-01: POST /api/v1/auth/register（注册；重复用户名 → 409）
}
