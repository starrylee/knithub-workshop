# language: zh
# 本 .feature 文件由 asdm-test-spec-ui-generate 基于前端源码生成
# 源码扫描范围: web-ui/src/components/Navbar.tsx、web-ui/src/components/LoginModal.tsx、
#   web-ui/src/context/AuthContext.tsx、web-ui/src/App.tsx（路由 /users/:username）、
#   web-ui/src/pages/NotebookPage.tsx（个人页头部展示）
# 种子数据依据: server/data/users.json（woolenwhimsy / knit123，displayName "Sarah Chen"）
# 注: 会话 Cookie（HttpOnly sid）的响应头断言属 API 层职责（见 user-login.api.feature），
#   本层以页面可观测行为（弹窗关闭、Navbar 登录态、页面导航）断言登录成功
# 注: 每条 AC 按 US 卡片中 PO 认可的实例化示例（各 2 条）逐一实例化为独立 Scenario，
#   实例化数据 wool456 / ghostweaver 已由 FT-01 决策 8 认可

@FT-01-US-02
@layer:e2e
Feature: 用户登录

  作为一个已注册的织友，
  我想要用用户名和密码登录，
  以便进入我的个人空间并持续使用 KnitHub。

  Background:
    Given 系统中存在如下注册用户：
      | username     | password | displayName |
      | woolenwhimsy | knit123  | Sarah Chen  |
    And 用户处于未登录状态，正在浏览首页 "/"

  # source: web-ui/src/components/Navbar.tsx（"登录 / 注册"按钮打开弹窗）、web-ui/src/components/LoginModal.tsx（"用户名"/"密码"字段、"登 录"提交按钮；成功后 onClose 关闭弹窗并 navigate 个人页）、web-ui/src/components/Navbar.tsx（登录态显示 displayName 与"退出"按钮）、web-ui/src/pages/NotebookPage.tsx（个人页头部 displayName 与 @username）
  @AC-1
  Scenario: AC-1 正确凭据登录成功建立会话
    When 用户点击导航栏的"登录 / 注册"按钮，打开标题为"欢迎回来"的登录弹窗
    And 在"用户名"输入框输入 "woolenwhimsy"
    And 在"密码"输入框输入 "knit123"
    And 点击"登 录"按钮
    Then 登录弹窗关闭，标题"欢迎回来"不再显示
    And 导航栏不再显示"登录 / 注册"按钮，改为显示用户名"Sarah Chen"与"退出"按钮
    And 页面导航至个人页 "/users/woolenwhimsy"，头部展示如下信息：
      | 字段     | 值            |
      | 显示名称 | Sarah Chen    |
      | 用户名   | @woolenwhimsy |

  # source: web-ui/src/components/LoginModal.tsx（登录成功导航 navigate(`/users/${user.username}`)）；FT-01 决策 4 用户名匹配大小写不敏感；导航目标取登录响应中的存储态用户名，非输入的大小写变体
  @AC-1
  Scenario: AC-1 用户名大小写变体登录成功
    When 用户点击导航栏的"登录 / 注册"按钮，打开标题为"欢迎回来"的登录弹窗
    And 在"用户名"输入框输入 "WoolenWhimsy"
    And 在"密码"输入框输入 "knit123"
    And 点击"登 录"按钮
    Then 登录弹窗关闭，标题"欢迎回来"不再显示
    And 导航栏改为显示用户名"Sarah Chen"与"退出"按钮
    And 页面导航至个人页 "/users/woolenwhimsy"（存储态用户名），头部显示名称"Sarah Chen"与用户名"@woolenwhimsy"

  # source: web-ui/src/components/LoginModal.tsx（登录失败 setError("用户名或密码错误")，AC-2 统一提示；失败时弹窗保持打开、无导航）
  @AC-2
  Scenario: AC-2 密码错误时显示统一错误提示
    When 用户点击导航栏的"登录 / 注册"按钮，打开标题为"欢迎回来"的登录弹窗
    And 在"用户名"输入框输入 "woolenwhimsy"
    And 在"密码"输入框输入 "wool456"
    And 点击"登 录"按钮
    Then 登录弹窗保持打开，弹窗内显示提示信息"用户名或密码错误"
    And 导航栏仍显示"登录 / 注册"按钮，页面停留在首页 "/"

  # source: web-ui/src/components/LoginModal.tsx（登录失败 setError("用户名或密码错误")——用户名不存在与密码错误共用同一文案，防用户名枚举）
  @AC-2
  Scenario: AC-2 用户名不存在时提示与密码错误一致
    Given 用户名 "ghostweaver" 从未注册
    When 用户点击导航栏的"登录 / 注册"按钮，打开标题为"欢迎回来"的登录弹窗
    And 在"用户名"输入框输入 "ghostweaver"
    And 在"密码"输入框输入 "anything123"
    And 点击"登 录"按钮
    Then 登录弹窗保持打开，弹窗内显示提示信息"用户名或密码错误"
    And 提示信息不包含"用户不存在"字样
    And 导航栏仍显示"登录 / 注册"按钮，页面停留在首页 "/"

  # source: web-ui/src/components/LoginModal.tsx（空输入前端必填校验 !username.trim() → setError("请输入用户名")，FT-01 决策 7；校验先行、不向后端发出登录请求）
  @AC-3
  Scenario: AC-3 用户名留空时前端必填校验
    When 用户点击导航栏的"登录 / 注册"按钮，打开标题为"欢迎回来"的登录弹窗
    And "用户名"输入框保持留空
    And 在"密码"输入框输入 "knit123"
    And 点击"登 录"按钮
    Then 登录弹窗保持打开，弹窗内显示提示信息"请输入用户名"
    And 未向后端发出登录请求
    And 导航栏仍显示"登录 / 注册"按钮，页面停留在首页 "/"

  # source: web-ui/src/components/LoginModal.tsx（空输入前端必填校验 !password → setError("请输入密码")，FT-01 决策 7；校验先行、不向后端发出登录请求）
  @AC-3
  Scenario: AC-3 密码留空时前端必填校验
    When 用户点击导航栏的"登录 / 注册"按钮，打开标题为"欢迎回来"的登录弹窗
    And 在"用户名"输入框输入 "woolenwhimsy"
    And "密码"输入框保持留空
    And 点击"登 录"按钮
    Then 登录弹窗保持打开，弹窗内显示提示信息"请输入密码"
    And 未向后端发出登录请求
    And 导航栏仍显示"登录 / 注册"按钮，页面停留在首页 "/"
