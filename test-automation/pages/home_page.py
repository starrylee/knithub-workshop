"""首页（HomePage）页面对象。

封装 ``web-ui/src/pages/HomePage.tsx`` 与 ``web-ui/src/components/Navbar.tsx``
中与登录相关的用户可见行为：
- 顶部导航栏：未登录显示「登录 / 注册」主按钮；登录后显示用户头像、
  ``displayName`` 与「退出」按钮。
- 登录弹窗由 ``LoginModal`` 组件打开（首页与其它页面共享同一 ``Navbar``）。
"""

from __future__ import annotations

from pages.base_page import BasePage


class HomePage(BasePage):
    """织友站点首页页面对象。"""

    #: 页面路由（导航到首页 "/" 用）
    @property
    def url_path(self) -> str:
        return "/"

    #: 顶部导航栏「登录 / 注册」主按钮（Navbar.tsx L110-116）
    LOGIN_REGISTER_BUTTON = 'button:has-text("登录 / 注册")'
    #: 「退出」按钮（登录态显示，Navbar.tsx L99-107）
    LOGOUT_BUTTON = 'button:has-text("退出")'
    #: 导航栏「我的项目」链接（Navbar.tsx L9，authRequired；移动菜单折叠时不渲染，
    #:  默认 1920px 视口下仅桌面导航存在该元素）
    MY_PROJECTS_LINK = 'nav a:has-text("我的项目")'

    # ------------------------------------------------------------------
    # 顶部导航栏
    # ------------------------------------------------------------------
    def click_login_register(self) -> "HomePage":
        """点击导航栏「登录 / 注册」按钮（打开登录弹窗）。"""
        self.click(self.LOGIN_REGISTER_BUTTON)
        return self

    def click_my_projects(self) -> "HomePage":
        """点击导航栏「我的项目」链接（受限操作入口）。

        FT-01-US-05：未登录访客点击后应弹出登录弹窗（不发生路由跳转）。
        """
        self.click(self.MY_PROJECTS_LINK)
        return self

    def click_nav_entry(self, label: str) -> "HomePage":
        """点击导航栏指定受限入口（图案库 / 我的项目 / 社区 / 关于）。

        FT-01-US-05（口径 A 变更后）：未登录访客点击任一受限入口均弹出登录
        弹窗且停留当前页；已登录用户点击直达目标页面。
        """
        locator = self.page.locator(f'header nav a:has-text("{label}")').first
        locator.wait_for(state="visible", timeout=10000)
        locator.click()
        return self

    def has_login_register_button(self) -> bool:
        """导航栏当前是否显示「登录 / 注册」按钮（未登录态）。"""
        return self.page.locator(self.LOGIN_REGISTER_BUTTON).count() > 0

    def wait_logout_button(self) -> "HomePage":
        """等待「退出」按钮可见（登录态标志）。"""
        self.wait_for_visible(self.LOGOUT_BUTTON)
        return self

    def navbar_text(self) -> str:
        """读取顶部导航栏整体文本（用于登录态断言）。"""
        return (self.page.locator("header").first.inner_text() or "").strip()


__all__ = ["HomePage"]
