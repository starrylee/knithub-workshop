"""登录弹窗（LoginModal）组件页面对象。

封装 ``web-ui/src/components/LoginModal.tsx`` 暴露给用户的可见行为：
打开后呈现标题（登录态「欢迎回来」）、「用户名」/「密码」输入框、
「登 录」提交按钮与行内错误提示（``form p``）。

定位依据（源码事实，勿在未同步前端时臆改）：
- 用户名输入框 placeholder 为 ``如 woolenwhimsy``（LoginModal.tsx L81）
- 密码输入框是弹窗内唯一的 ``input[type="password"]``（L94-105）
- 提交按钮是弹窗内唯一的 ``button[type="submit"]``（L114-120）
- 行内错误是 ``<form>`` 内唯一的 ``<p>``（L108-112）
"""

from __future__ import annotations

from typing import Optional

from core.logger import get_logger
from core.wait_utils import WaitUtils

logger = get_logger(__name__)

#: 登录态弹窗标题
TITLE_LOGIN = "欢迎回来"
#: 注册态弹窗标题
TITLE_REGISTER = "加入 KnitHub"


class LoginModal:
    """登录弹窗组件页面对象。

    弹窗是覆盖层（不产生独立路由），因此不继承 ``BasePage``，
    而是直接持有当前 ``page`` 并提供组件级操作与断言。
    """

    #: 标题常量（类级别名，供 Step Definitions 引用）
    TITLE_LOGIN = TITLE_LOGIN
    TITLE_REGISTER = TITLE_REGISTER

    #: 用户名输入框（placeholder 为唯一标识）
    USERNAME_INPUT = 'input[placeholder="如 woolenwhimsy"]'
    #: 密码输入框
    PASSWORD_INPUT = 'input[type="password"]'
    #: 提交按钮
    SUBMIT_BUTTON = 'button[type="submit"]'
    #: 行内错误提示容器（form 内唯一 p）
    ERROR_LOCATOR = "form p"

    def __init__(self, page) -> None:
        """初始化。

        Args:
            page: Playwright ``Page`` 实例（弹窗所在页面）。
        """
        self.page = page
        self.wait = WaitUtils()

    # ------------------------------------------------------------------
    # 状态等待与断言
    # ------------------------------------------------------------------
    @staticmethod
    def _title_selector(title: str) -> str:
        """根据标题文本构造弹窗标题选择器。"""
        return f'h2:has-text("{title}")'

    def wait_until_open(self, title: str = TITLE_LOGIN, timeout: Optional[int] = None) -> "LoginModal":
        """等待弹窗打开（标题可见）。"""
        self.wait.wait_for_element_visible(self.page, self._title_selector(title), timeout)
        logger.info("登录弹窗已打开（标题：%s）", title)
        return self

    def wait_until_closed(self, title: str = TITLE_LOGIN, timeout: Optional[int] = None) -> "LoginModal":
        """等待弹窗关闭（标题隐藏或从 DOM 移除）。"""
        self.wait.wait_for_element_hidden(self.page, self._title_selector(title), timeout)
        logger.info("登录弹窗已关闭")
        return self

    def is_open(self, title: str = TITLE_LOGIN, timeout: int = 2000) -> bool:
        """弹窗当前是否打开（标题在超时内可见）。"""
        try:
            self.wait.wait_for_element_visible(self.page, self._title_selector(title), timeout)
            return True
        except Exception:
            return False

    def expect_error(self, message: str, timeout: Optional[int] = None) -> "LoginModal":
        """断言弹窗内出现指定错误提示文本。"""
        self.wait.wait_for_element_visible(self.page, f'p:has-text("{message}")', timeout)
        logger.info("断言弹窗错误提示：%s", message)
        return self

    def get_error_text(self) -> str:
        """读取当前行内错误提示文本（无错误时返回空字符串）。"""
        locator = self.page.locator(self.ERROR_LOCATOR)
        if locator.count() == 0:
            return ""
        return (locator.first.inner_text() or "").strip()

    # ------------------------------------------------------------------
    # 表单操作
    # ------------------------------------------------------------------
    def fill_username(self, value: str, timeout: Optional[int] = None) -> "LoginModal":
        """填写用户名输入框。"""
        self.wait.wait_for_element_visible(self.page, self.USERNAME_INPUT, timeout)
        self.page.locator(self.USERNAME_INPUT).fill(value)
        logger.info("填写用户名：%s", value)
        return self

    def fill_password(self, value: str, timeout: Optional[int] = None) -> "LoginModal":
        """填写密码输入框。"""
        self.wait.wait_for_element_visible(self.page, self.PASSWORD_INPUT, timeout)
        self.page.locator(self.PASSWORD_INPUT).fill(value)
        logger.info("填写密码：%s", "***" if value else "")
        return self

    def click_submit(self) -> "LoginModal":
        """点击提交按钮（「登 录」/「注 册」）。"""
        self.wait.wait_for_element_visible(self.page, self.SUBMIT_BUTTON)
        self.page.locator(self.SUBMIT_BUTTON).click()
        logger.info("点击提交按钮")
        return self


__all__ = ["LoginModal", "TITLE_LOGIN", "TITLE_REGISTER"]
