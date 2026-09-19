package com.knithub.server.auth;

import com.knithub.server.domain.User;
import com.knithub.server.repo.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

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
     * 注册并即时建立会话（FT-01-US-01 AC-1：注册成功即进入登录态）。
     *
     * <p>账户按最小集生成：displayName 默认同用户名；密码以 BCrypt 哈希入库
     * （AC-4：任何用户记录中不存在明文）。
     */
    public LoginResult register(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new UsernameAlreadyTakenException();
        }
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setDisplayName(username);
        user.setCreatedAt(Instant.now().toString());
        User saved = userRepository.save(user);
        String sid = sessionManager.createSession(saved.getId());
        return new LoginResult(saved, sid);
    }

    /**
     * 鉴权结果：用户实体（转 UserResponse 输出）+ 会话 id（设置 Cookie 用）。
     */
    public record LoginResult(User user, String sid) {
    }

    /**
     * 凭据无效（用户名或密码错误）——Controller 层统一转 401 + 统一提示。
     */
    public static class InvalidCredentialsException extends RuntimeException {
    }

    /**
     * 用户名已被占用（FT-01-US-01 AC-2）——Controller 层转 409 + 明确提示。
     *
     * <p>唯一性口径与登录一致：大小写不敏感（决策 4/11，由 Repository 层判定）。
     */
    public static class UsernameAlreadyTakenException extends RuntimeException {
    }

    // TODO FT-01-US-01: register（唯一性校验 → 409 / BCrypt 哈希入库 / 注册即登录）
}
