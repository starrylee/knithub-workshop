@FT-01-US-01
@layer:e2e
Feature: 新用户注册

  作为一个想加入 KnitHub 的新织女，
  我想要用用户名和密码一步完成注册并立即进入登录态，
  以便零门槛开始使用 KnitHub 记录我的编织生活。

  Background:
    Given 用户处于未登录状态，正在浏览首页 "/"

  @AC-1
  Scenario: AC-1 示例 1 - 未注册用户名注册成功，弹窗关闭并停留在当前页进入登录态
    Given 待注册的用户名 "snowflake" 当前未被占用
    When 用户切换到注册 tab，打开标题为"加入 KnitHub"的注册表单
    And 在"用户名"输入框输入 "snowflake"
    And 在"密码"输入框输入 "mittens2026"
    And 在"确认密码"输入框输入 "mittens2026"
    And 点击"注 册"按钮
    Then 注册弹窗关闭
    And 页面停留在首页 "/"
    And 导航栏改为显示用户名"snowflake"与"退出"按钮

  # 需求更新（2026-09-08）：注册须二次输入密码（确认密码），两次不一致时前端拦截、不发起请求。
  Scenario: 示例 1 - 两次输入的密码不一致被前端拦截并提示
    Given 待注册的用户名 "snowpuff" 当前未被占用
    When 用户切换到注册 tab，打开标题为"加入 KnitHub"的注册表单
    And 在"用户名"输入框输入 "snowpuff"
    And 在"密码"输入框输入 "mittens2026"
    And 在"确认密码"输入框输入 "mittens2027"
    And 点击"注 册"按钮
    Then 注册弹窗保持打开，弹窗内显示提示信息"两次输入的密码不一致"

  @AC-2
  Scenario: AC-2 示例 1 - 已被占用的用户名注册被拒绝，提示用户名已被占用
    Given 系统中存在如下注册用户：
      | username     | password | displayName |
      | woolenwhimsy | knit123  | Sarah Chen  |
    When 用户切换到注册 tab，打开标题为"加入 KnitHub"的注册表单
    And 在"用户名"输入框输入 "woolenwhimsy"
    And 在"密码"输入框输入 "mittens2026"
    And 在"确认密码"输入框输入 "mittens2026"
    And 点击"注 册"按钮
    Then 注册弹窗保持打开，弹窗内显示提示信息"用户名已被占用"
    And "用户名"输入框保留已填内容 "woolenwhimsy"
    And "密码"输入框已清空

  @AC-2
  Scenario: AC-2 示例 2 - 大小写变体的重名用户名同样被拒绝
    Given 系统中存在如下注册用户：
      | username     | password | displayName |
      | woolenwhimsy | knit123  | Sarah Chen  |
    When 用户切换到注册 tab，打开标题为"加入 KnitHub"的注册表单
    And 在"用户名"输入框输入 "WoolenWhimsy"
    And 在"密码"输入框输入 "mittens2026"
    And 在"确认密码"输入框输入 "mittens2026"
    And 点击"注 册"按钮
    Then 注册弹窗保持打开，弹窗内显示提示信息"用户名已被占用"

  @AC-3
  Scenario: AC-3 示例 1 - 密码少于 6 位被拒绝并提示密码规则
    Given 待注册的用户名 "newweaver" 当前未被占用
    When 用户切换到注册 tab，打开标题为"加入 KnitHub"的注册表单
    And 在"用户名"输入框输入 "newweaver"
    And 在"密码"输入框输入 "knit1"
    And 在"确认密码"输入框输入 "knit1"
    And 点击"注 册"按钮
    Then 注册弹窗保持打开，弹窗内显示提示信息"密码需为 6–20 位，且包含字母和数字"
