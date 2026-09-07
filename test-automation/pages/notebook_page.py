"""个人页（NotebookPage，路由 /users/:username）页面对象。

选择器全部溯源自被测前端源码：
- web-ui/src/pages/NotebookPage.tsx（登录成功 navigate 的目标页；
  Profile Header 渲染 pageUser 的 displayName 与 @username）
"""

from __future__ import annotations

from assertpy import assert_that

from pages.base_page import BasePage


class NotebookPage(BasePage):
    """个人页 POM：Profile Header 展示与个人页 URL 断言。"""

    # Profile Header 展示名称 h1（渲染 pageUser.displayName；
    # "main" 限定排除布局外的 Footer 等区块）
    # 来源: web-ui/src/pages/NotebookPage.tsx L92-114
    PROFILE_DISPLAY_NAME = "main div.py-10 h1"

    # Profile Header @username 行（渲染 @{pageUser.username}，mock 数据
    # location 非空时追加 " · 📍 location" 后缀——断言须用 contains）
    # 来源: web-ui/src/pages/NotebookPage.tsx L115-118
    PROFILE_USERNAME = "main div.py-10 p.text-sm.mb-2"

    @property
    def url_path(self) -> str:
        """路由前缀；实际路径为 /users/:username（由登录跳转进入，不直接导航）。"""
        return "/users"

    # ------------------------------------------------------------------
    # 断言（Then 步骤）
    # ------------------------------------------------------------------
    def assert_url_is_user_page(self, path: str) -> "NotebookPage":
        """断言当前 URL 等于 base_url + path（如 /users/woolenwhimsy）。"""
        expected = f"{self.config.base_url}/{path.lstrip('/')}"
        assert_that(self.page.url).described_as(
            f"个人页 URL 断言失败（期望 {expected}，实际 {self.page.url}）"
        ).is_equal_to(expected)
        return self

    def assert_header_display_name(self, display_name: str) -> "NotebookPage":
        """断言 Profile Header 展示名称（h1）完全等于 display_name。"""
        return self.assert_element_text(self.PROFILE_DISPLAY_NAME, display_name)

    def assert_header_username(self, username_with_at: str) -> "NotebookPage":
        """断言 Profile Header @username 行包含 username_with_at（含 @ 前缀）。

        使用 contains 断言：mock 数据（web-ui/src/data/user-list.json）
        location 非空时该行渲染为 "@username · 📍 location"
        （NotebookPage.tsx L117）；fallback 渲染（location 为空）为纯
        "@username"——两种路径 contains 均成立。
        """
        return self.assert_element_contains_text(self.PROFILE_USERNAME, username_with_at)
