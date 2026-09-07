package com.knithub.server.auth;

import com.knithub.server.domain.User;
import com.knithub.server.repo.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 鉴权业务层（技术方案第 4 节阶段 2~3）。
 *
 * <p>FT-01-US-02 交付：登录凭据校验（BCrypt；用户名匹配大小写不敏感，FT-01
 * 决策 4——由 Repository 层统一 lowercase 比对）与会话建立。凭据错误统一抛
 * {@link InvalidCredentialsException}，不区分用户名不存在与密码错误（防用户名
 * 枚举，AC-2）。
 *
 * <p>后续随对应 US 交付：注册（US-01）。
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final SessionManager sessionManager;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, SessionManager sessionManager) {
        this.userRepository = userRepository;
        this.sessionManager = sessionManager;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    /**
     * 校验凭据并建立会话。
     *
     * @throws InvalidCredentialsException 用户名不存在或密码错误（统一提示）
     */
    public LoginResult login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        String sid = sessionManager.createSession(user.getId());
        return new LoginResult(user, sid);
    }

    /**
     * 登录成功结果：用户实体（转 UserResponse 输出）+ 会话 id（设置 Cookie 用）。
     */
    public record LoginResult(User user, String sid) {
    }

    /**
     * 凭据无效（用户名或密码错误）——Controller 层统一转 401 + 统一提示。
     */
    public static class InvalidCredentialsException extends RuntimeException {
    }

    // TODO FT-01-US-01: register（唯一性校验 → 409 / BCrypt 哈希入库 / 注册即登录）
}
