@FT-01-US-02
@layer:api
Feature: 用户登录 - API 层

  作为一个已注册的织友，
  我想要用用户名和密码登录，
  以便进入我的个人空间并持续使用 KnitHub。

  # 本 .feature 文件由 asdm-test-spec-api-generate 基于后端源码直接扫描生成，以 HTTP 语义实例化验收标准
  # 测试关注点: 接口契约(@api:contract) / 字段边界(@api:boundary) / 错误码(@api:error)
  # 依赖后端源码:
  #   - server/src/main/java/com/knithub/server/auth/AuthController.java（POST /api/v1/auth/login、401 异常处理、会话 Cookie 属性）
  #   - server/src/main/java/com/knithub/server/auth/AuthService.java（凭据校验与会话建立，InvalidCredentialsException 统一语义）
  #   - server/src/main/java/com/knithub/server/auth/dto/LoginRequest.java（username/password 的 @NotBlank 约束）
  #   - server/src/main/java/com/knithub/server/auth/dto/UserResponse.java（响应字段全集，camelCase）
  #   - server/src/main/java/com/knithub/server/repo/json/JsonUserRepository.java（用户名大小写不敏感匹配，FT-01 决策 4）
  #   - server/data/users.json（种子数据；实例化数据 wool456 / ghostweaver 已 PO 认可，FT-01 决策 8）
  # 注: AC-1 的前端导航（跳转 /users/{username}）与 Navbar 展示、AC-3 的前端必填拦截（不发请求）
  #     均属 UI 端到端层（@layer:e2e）职责；API 层仅实例化 HTTP 可观测行为，
  #     其中 AC-3 实例化为后端 @NotBlank 兜底校验（绕过前端直接调用后端的边界）

  Background:
    Given 请求基础地址为 "http://localhost:8080"

  # ========== AC-1: 登录成功建立会话 ==========

  # source: com.knithub.server.auth.AuthController#login (POST /api/v1/auth/login)；
  #         响应字段依据 com.knithub.server.auth.dto.UserResponse（id/username/displayName/avatar，无 passwordHash）；
  #         Cookie 属性依据 AuthController#login 内 ResponseCookie 构造（SESSION_COOKIE_MAX_AGE = Duration.ofDays(7) = 604800 秒）
  @api:contract
  @AC-1
  Scenario: AC-1 接口契约 - 正确凭据登录成功返回用户信息并建立会话 Cookie
    Given 请求认证状态为 "未登录"
    And 存在如下注册用户:
      | id | username     | password | display_name | avatar                                                                                        |
      | 2  | woolenwhimsy | knit123  | Sarah Chen   | https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format  |
    When 发送 POST 请求 "/api/v1/auth/login"，请求体如下
    """
    {
      "username": "woolenwhimsy",
      "password": "knit123"
    }
    """
    Then 响应状态码为 200
    And 返回如下用户信息
    """
    {
      "id": 2,
      "username": "woolenwhimsy",
      "displayName": "Sarah Chen",
      "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format"
    }
    """
    And 响应头 Set-Cookie 包含 "sid="
    And 响应头 Set-Cookie 包含 "Path=/"
    And 响应头 Set-Cookie 包含 "HttpOnly"
    And 响应头 Set-Cookie 包含 "SameSite=Lax"
    And 响应头 Set-Cookie 包含 "Max-Age=604800"

  # source: com.knithub.server.repo.json.JsonUserRepository#findByUsername (equalsIgnoreCase，FT-01 决策 4)；
  #         com.knithub.server.auth.AuthController#login——响应 username 取存储态实体（UserResponse.from(result.user())）
  @api:contract
  @AC-1
  Scenario: AC-1 接口契约 - 用户名大小写变体登录成功且响应返回存储态用户名
    Given 请求认证状态为 "未登录"
    And 存在如下注册用户:
      | id | username     | password | display_name | avatar                                                                                        |
      | 2  | woolenwhimsy | knit123  | Sarah Chen   | https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format  |
    When 发送 POST 请求 "/api/v1/auth/login"，请求体如下
    """
    {
      "username": "WoolenWhimsy",
      "password": "knit123"
    }
    """
    Then 响应状态码为 200
    And 返回如下用户信息
    """
    {
      "id": 2,
      "username": "woolenwhimsy",
      "displayName": "Sarah Chen",
      "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format"
    }
    """

  # ========== AC-2: 登录失败统一提示 ==========

  # source: com.knithub.server.auth.AuthController#handleInvalidCredentials (AuthService.InvalidCredentialsException → 401 + 硬编码文案)；
  #         密码错误路径 com.knithub.server.auth.AuthService#login (BCryptPasswordEncoder.matches 校验失败抛出)
  @api:error
  @AC-2
  Scenario: AC-2 错误码 - 密码错误返回 401 统一提示
    Given 请求认证状态为 "未登录"
    And 存在如下注册用户:
      | id | username     | password | display_name | avatar                                                                                        |
      | 2  | woolenwhimsy | knit123  | Sarah Chen   | https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format  |
    When 发送 POST 请求 "/api/v1/auth/login"，请求体如下
    """
    {
      "username": "woolenwhimsy",
      "password": "wool456"
    }
    """
    Then 响应状态码为 401
    And 返回如下错误信息
    """
    {
      "message": "用户名或密码错误"
    }
    """

  # source: com.knithub.server.auth.AuthController#handleInvalidCredentials (AuthService.InvalidCredentialsException → 401 + 硬编码文案)；
  #         用户名不存在路径 com.knithub.server.auth.AuthService#login (findByUsername 为 empty 即抛出)——
  #         与密码错误共用同一异常类与同一文案，两场景响应完全一致（防用户名枚举，AC-2）
  @api:error
  @AC-2
  Scenario: AC-2 错误码 - 用户名不存在返回与密码错误完全一致的 401 响应
    Given 请求认证状态为 "未登录"
    And 存在如下注册用户:
      | id | username     | password | display_name | avatar                                                                                        |
      | 2  | woolenwhimsy | knit123  | Sarah Chen   | https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format  |
    When 发送 POST 请求 "/api/v1/auth/login"，请求体如下
    """
    {
      "username": "ghostweaver",
      "password": "anything123"
    }
    """
    Then 响应状态码为 401
    And 返回如下错误信息
    """
    {
      "message": "用户名或密码错误"
    }
    """

  # ========== AC-3: 空输入必填校验（API 层实例化为后端 @NotBlank 兜底；前端拦截主体行为属 @layer:e2e） ==========

  # source: com.knithub.server.auth.dto.LoginRequest#username (@NotBlank)
  # 待人工确认: 400 响应体结构为 Spring Boot 默认校验失败响应（源码无自定义 MethodArgumentNotValidException 处理器），具体字段结构待联调确认
  @api:boundary
  @AC-3
  Scenario: AC-3 字段边界 - 绕过前端直接调用后端时 username 为空字符串
    Given 请求认证状态为 "未登录"
    When 发送 POST 请求 "/api/v1/auth/login"，请求体如下
    """
    {
      "username": "",
      "password": "knit123"
    }
    """
    Then 响应状态码为 400

  # source: com.knithub.server.auth.dto.LoginRequest#username (@NotBlank——trim 后为空即拦截)
  # 待人工确认: 400 响应体结构为 Spring Boot 默认校验失败响应（源码无自定义 MethodArgumentNotValidException 处理器），具体字段结构待联调确认
  @api:boundary
  @AC-3
  Scenario: AC-3 字段边界 - username 为纯空格
    Given 请求认证状态为 "未登录"
    When 发送 POST 请求 "/api/v1/auth/login"，请求体如下
    """
    {
      "username": "   ",
      "password": "knit123"
    }
    """
    Then 响应状态码为 400

  # source: com.knithub.server.auth.dto.LoginRequest#password (@NotBlank)
  # 待人工确认: 400 响应体结构为 Spring Boot 默认校验失败响应（源码无自定义 MethodArgumentNotValidException 处理器），具体字段结构待联调确认
  @api:boundary
  @AC-3
  Scenario: AC-3 字段边界 - 绕过前端直接调用后端时 password 为空字符串
    Given 请求认证状态为 "未登录"
    When 发送 POST 请求 "/api/v1/auth/login"，请求体如下
    """
    {
      "username": "woolenwhimsy",
      "password": ""
    }
    """
    Then 响应状态码为 400

  # source: com.knithub.server.auth.dto.LoginRequest#password (@NotBlank 对 null 同样拦截——缺失字段经 Jackson 反序列化为 null)
  # 待人工确认: 400 响应体结构为 Spring Boot 默认校验失败响应（源码无自定义 MethodArgumentNotValidException 处理器），具体字段结构待联调确认
  @api:boundary
  @AC-3
  Scenario: AC-3 字段边界 - 请求体缺失 password 字段
    Given 请求认证状态为 "未登录"
    When 发送 POST 请求 "/api/v1/auth/login"，请求体如下
    """
    {
      "username": "woolenwhimsy"
    }
    """
    Then 响应状态码为 400
