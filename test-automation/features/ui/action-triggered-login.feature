# 本 .feature 文件依据 FT-01-US-05-action-triggered-login.md（需求变更口径 A）生成。
# 需求变更要点（2026-09-08 已由需求方确认）：
#   「图案库 / 社区 / 关于」由"公开免登录浏览页"改为「受限入口」——与「我的项目」一样，
#   未登录访客点击导航入口须弹出登录弹窗，登录成功后自动续接到对应目标页（登录续接）。
#   全站仅「首页 /」保留为公开落地页（可直接浏览）。
# 依赖: FT-01-US-02（登录能力）、FT-01-US-03（登录态上下文）——均已交付（LoginModal / AuthContext）
# 交互事实: web-ui/src/components/Navbar.tsx（图案库/社区/关于/我的项目 均 authRequired，
#   未登录点击 handleNavLinkClick：preventDefault + 弹 LoginModal 并记录续接目标）；
#   web-ui/src/components/LoginModal.tsx（redirectTo 登录成功后 navigate 续接目标，
#   缺省跳个人页）。

@FT-01-US-05
@layer:e2e
Feature: 操作触发登录（受限入口：图案库 / 我的项目 / 社区 / 关于）

  作为一个未登录的访客，
  我想要在做需要登录的操作时被引导到登录弹窗、并在登录后继续刚才想做的事，
  以便顺畅完成操作而不被一堵"请先登录"的墙挡住。

  # source: FT-01-US-05-action-triggered-login.md AC-1 + 需求变更口径 A
  # 交互事实: Navbar「图案库/社区/关于」与「我的项目」均为 authRequired 受限入口；
  #   来源页仅为公开落地页首页 "/"（其余内容页已不公开）
  @AC-1
  Scenario Outline: AC-1 访客在首页点击受限导航入口弹出登录弹窗且不发生跳转
    Given 用户处于未登录状态，正在浏览首页 "/"
    When 用户点击导航栏的"<受限入口>"
    Then 弹出标题为"欢迎回来"的登录弹窗
    And 页面仍停留在首页 "/"，未发生页面拦截跳转

    Examples:
      | 受限入口 |
      | 图案库   |
      | 我的项目 |
      | 社区     |
      | 关于     |

  # source: FT-01-US-05-action-triggered-login.md AC-2 实例化示例 + 需求变更口径 A
  # 交互事实: LoginModal redirectTo（登录成功 navigate 续接目标）：
  #   图案库→/patterns、社区→/community、关于→/about、我的项目→/users/{username}
  @AC-2
  Scenario Outline: AC-2 触发弹窗中登录成功后自动续接进入受限入口目标页
    Given 系统中存在如下注册用户：
      | username     | password | displayName |
      | woolenwhimsy | knit123  | Sarah Chen  |
    And 用户处于未登录状态，正在浏览首页 "/"
    When 用户点击导航栏的"<受限入口>"
    And 在"用户名"输入框输入 "woolenwhimsy"
    And 在"密码"输入框输入 "knit123"
    And 点击"登 录"按钮
    Then 登录弹窗关闭，标题"欢迎回来"不再显示
    And 页面自动续接进入 "<目标页面>"

    Examples:
      | 受限入口 | 目标页面            |
      | 图案库   | /patterns           |
      | 社区     | /community          |
      | 关于     | /about              |
      | 我的项目 | /users/woolenwhimsy |

  # source: FT-01-US-05-action-triggered-login.md AC-2 + 澄清决策 D6（登录失败绝不触发续接）
  @AC-2
  Scenario: AC-2 触发弹窗中登录失败不自动续接，弹窗保持打开且不跳转
    Given 系统中存在如下注册用户：
      | username     | password | displayName |
      | woolenwhimsy | knit123  | Sarah Chen  |
    And 用户处于未登录状态，正在浏览首页 "/"
    When 用户点击导航栏的"图案库"
    And 在"用户名"输入框输入 "woolenwhimsy"
    And 在"密码"输入框输入 "wrongpass"
    And 点击"登 录"按钮
    Then 登录弹窗保持打开，弹窗内显示提示信息"用户名或密码错误"
    And 导航栏仍显示"登录 / 注册"按钮，页面停留在首页 "/"

  # source: FT-01-US-05 需求变更口径 A（原 AC-3「公开页免登录浏览」已撤销：
  #   图案库/社区/关于改为受限入口，仅首页公开）
  # 交互事实: Navbar（已登录用户点击受限入口走默认 Link 导航，不再弹登录弹窗）
  @AC-3
  Scenario: AC-3 登录成功后续接进入受限内容页，且已登录用户再点其它受限入口直达无需弹窗
    Given 系统中存在如下注册用户：
      | username     | password | displayName |
      | woolenwhimsy | knit123  | Sarah Chen  |
    And 用户处于未登录状态，正在浏览首页 "/"
    When 用户点击导航栏的"社区"
    And 在"用户名"输入框输入 "woolenwhimsy"
    And 在"密码"输入框输入 "knit123"
    And 点击"登 录"按钮
    Then 登录弹窗关闭，标题"欢迎回来"不再显示
    And 页面自动续接进入 "/community"
    When 用户点击导航栏的"图案库"
    Then 页面自动续接进入 "/patterns"
    And 无登录弹窗出现
