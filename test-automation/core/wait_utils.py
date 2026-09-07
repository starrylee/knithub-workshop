"""UI 等待工具。

封装 Playwright 常用等待逻辑，避免在 Step Definitions 中散落 ``time.sleep``。
"""

from __future__ import annotations

from typing import Optional

from core.config import Config
from core.logger import get_logger

logger = get_logger(__name__)


class WaitUtils:
    """UI 等待工具集（全部为静态方法）。"""

    @staticmethod
    def _timeout(timeout: Optional[int] = None) -> int:
        """未显式指定超时时使用配置默认值。"""
        return timeout if timeout is not None else Config().default_timeout

    @staticmethod
    def wait_for_element_visible(page, selector: str, timeout: Optional[int] = None):
        """等待元素可见。

        Args:
            page: Playwright Page。
            selector: CSS / XPath 选择器。
            timeout: 超时（毫秒），缺省取 ``DEFAULT_TIMEOUT``。

        Returns:
            可见的 ``Locator``。
        """
        locator = page.locator(selector).first
        locator.wait_for(state="visible", timeout=WaitUtils._timeout(timeout))
        return locator

    @staticmethod
    def wait_for_element_hidden(page, selector: str, timeout: Optional[int] = None):
        """等待元素隐藏或从 DOM 移除。"""
        locator = page.locator(selector).first
        locator.wait_for(state="hidden", timeout=WaitUtils._timeout(timeout))
        return locator

    @staticmethod
    def wait_for_element_attached(page, selector: str, timeout: Optional[int] = None):
        """等待元素挂载到 DOM（不要求可见）。"""
        locator = page.locator(selector).first
        locator.wait_for(state="attached", timeout=WaitUtils._timeout(timeout))
        return locator

    @staticmethod
    def wait_for_text(page, selector: str, text: str, timeout: Optional[int] = None):
        """等待元素文本包含指定内容。"""
        locator = page.locator(selector).first
        locator.filter(has_text=text).wait_for(state="visible", timeout=WaitUtils._timeout(timeout))
        return locator

    @staticmethod
    def wait_for_network_idle(page, timeout: Optional[int] = None) -> None:
        """等待网络空闲。

        Args:
            page: Playwright Page。
            timeout: 超时（毫秒），缺省取 ``NAVIGATION_TIMEOUT``。
        """
        page.wait_for_load_state(
            "networkidle",
            timeout=timeout if timeout is not None else Config().navigation_timeout,
        )

    @staticmethod
    def wait_for_url_contains(page, fragment: str, timeout: Optional[int] = None) -> str:
        """等待当前 URL 包含指定片段，返回最终 URL。"""
        page.wait_for_url(f"**/*{fragment}*", timeout=WaitUtils._timeout(timeout))
        return page.url

    @staticmethod
    def wait_for_milliseconds(page, milliseconds: int = 500) -> None:
        """强制等待（仅在无更优等待条件时使用，强烈不推荐）。"""
        logger.warning("使用强制等待 %sms，建议改用显式等待条件", milliseconds)
        page.wait_for_timeout(milliseconds)


__all__ = ["WaitUtils"]
