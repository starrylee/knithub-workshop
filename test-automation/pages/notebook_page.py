"""个人页 / 笔记本页（NotebookPage）页面对象。

封装 ``web-ui/src/pages/NotebookPage.tsx`` 的 Profile 头部：
- ``<h1>`` 显示 ``displayName``（L109-114）
- ``<p>`` 显示 ``@{username}``（L115-118）

FT-01 兜底逻辑：登录真实后端账号（非 mock 用户）时个人页以
``currentUser`` 兜底渲染头部，项目/队列/库存为空列表——因此本对象
只断言 Profile 头部身份信息，不断言 mock 项目卡片。
"""

from __future__ import annotations

from typing import Optional

from pages.base_page import BasePage


class NotebookPage(BasePage):
    """个人笔记本页页面对象。"""

    def __init__(self, page, username: str) -> None:
        """初始化。

        Args:
            page: Playwright ``Page`` 实例。
            username: 个人页路径中的用户名（``/users/{username}``）。
        """
        super().__init__(page)
        self.username = username

    @property
    def url_path(self) -> str:
        """个人页路由。"""
        return f"/users/{self.username}"

    # ------------------------------------------------------------------
    # Profile 头部断言
    # ------------------------------------------------------------------
    def wait_display_name(self, display_name: str, timeout: Optional[int] = None) -> "NotebookPage":
        """等待 Profile 头部 ``<h1>`` 显示指定显示名称。"""
        self.wait.wait_for_element_visible(
            self.page, f"//h1[normalize-space(.)='{display_name}']", timeout
        )
        return self

    def wait_username(self, username: str, timeout: Optional[int] = None) -> "NotebookPage":
        """等待 Profile 头部显示 ``@{username}``。"""
        self.wait.wait_for_element_visible(
            self.page, f"//p[contains(normalize-space(.),'@{username}')]", timeout
        )
        return self


__all__ = ["NotebookPage"]
