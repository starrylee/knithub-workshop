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
 * <p>FT-01-US-04 交付：{@code POST /api/v1/auth/logout}——销毁 sid 会话 +
 * 下发 Max-Age=0 清除 Cookie。后续端点随对应 US 交付：register（US-01）、
 * me（US-03）。
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
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, sidCookie(result.sid(), SESSION_COOKIE_MAX_AGE).toString())
                .body(UserResponse.from(result.user()));
    }

    /**
     * 登出（FT-01-US-04）：销毁 sid 对应服务端会话 + 下发 Max-Age=0 的清除
     * Cookie，双重保障杜绝「假登出」。返回 200 无响应体，前端凭响应成功
     * 才清除本地登录态。
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(name = "sid", required = false) String sid) {
        authService.logout(sid);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, sidCookie("", Duration.ZERO).toString())
                .build();
    }

    /**
     * 构造 {@code sid} 会话 Cookie（HttpOnly + SameSite=Lax + Path=/；
     * 登录 Set 有效值、登出以 Max-Age=0 清除）。
     */
    private static ResponseCookie sidCookie(String value, Duration maxAge) {
        return ResponseCookie.from("sid", value)
                .httpOnly(true)
                .sameSite("Lax")
                .maxAge(maxAge)
                .path("/")
                .build();
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
    // TODO FT-01-US-03: GET /api/v1/auth/me（会话恢复，刷新不掉登录态）
}
