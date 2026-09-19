package com.knithub.server.auth;

import com.knithub.server.auth.dto.LoginRequest;
import com.knithub.server.auth.dto.RegisterRequest;
import com.knithub.server.auth.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
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
        return okWithSessionCookie(result);
    }

    /**
     * 参数校验失败 → 400 + 明确提示（AC-3：密码规则；AC-5：用户名格式兜底。
     * 提示文案由 DTO 注解的 message 提供，前端原样展示）。
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("请求参数不合法");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    /**
     * 用户名已被占用 → 409 + 明确提示（AC-2：注册失败且不产生新账号）。
     */
    @ExceptionHandler(AuthService.UsernameAlreadyTakenException.class)
    public ResponseEntity<Map<String, String>> handleUsernameTaken(AuthService.UsernameAlreadyTakenException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "用户名已被占用"));
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
     * 注册（FT-01-US-01）：成功 200 + UserResponse + 与登录一致的会话 Cookie
     * {@code sid}（AC-1：注册成功即时进入登录态）。
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthService.LoginResult result = authService.register(request.getUsername(), request.getPassword());
        return okWithSessionCookie(result);
    }

    /**
     * 200 + 用户信息 + 会话 Cookie {@code sid}（登录与注册共用同一套会话属性）。
     */
    private ResponseEntity<UserResponse> okWithSessionCookie(AuthService.LoginResult result) {
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
    // TODO FT-01-US-03: GET /api/v1/auth/me（会话恢复，刷新不掉登录态）
    // TODO FT-01-US-04: POST /api/v1/auth/logout（登出销毁会话）
}
