"""页面对象模型（POM）基类。

所有页面类继承 ``BasePage`` 并实现 ``url_path``，即可获得导航、元素操作、
重试与断言等通用能力。
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from assertpy import assert_that

from core.config import Config
from core.logger import get_logger
from core.wait_utils import WaitUtils

logger = get_logger(__name__)


class BasePage(ABC):
    """页面对象基类。

    Example:
        >>> class LoginPage(BasePage):
        ...     @property
        ...     def url_path(self) -> str:
        ...         return "/login"
        ...     def login(self, username, password):
        ...         self.fill("#username", username)
        ...         self.fill("#password", password)
        ...         self.click("button[type=submit]")
    """

    def __init__(self, page) -> None:
        """初始化。

        Args:
            page: Playwright ``Page`` 实例。
        """
        self.page = page
        self.config = Config()
        self.wait = WaitUtils()

    # ------------------------------------------------------------------
    # URL / 导航
    # ------------------------------------------------------------------
    @property
    @abstractmethod
    def url_path(self) -> str:
        """页面相对路径（子类必须实现），如 ``/login``。"""
        raise NotImplementedError

    @property
    def full_url(self) -> str:
        """完整 URL（base_url + url_path）。"""
        return f"{self.config.base_url}/{str(self.url_path).lstrip('/')}"

    def navigate(self, wait_until: str = "domcontentloaded") -> "BasePage":
        """导航到本页并等待加载完成。

        Args:
            wait_until: Playwright 等待策略，默认 ``domcontentloaded``。

        Returns:
            self，支持链式调用。
        """
        logger.info("导航到页面：%s", self.full_url)
        self.page.goto(self.full_url, wait_until=wait_until)
        return self

    def reload(self) -> "BasePage":
        """刷新当前页面。"""
        self.page.reload()
        return self

    # ------------------------------------------------------------------
    # 元素操作
    # ------------------------------------------------------------------
    def locator(self, selector: str, index: int = 0):
        """获取定位器（默认取首个匹配元素）。"""
        return self.page.locator(selector).nth(index)

    def click(self, selector: str, timeout: Optional[int] = None) -> "BasePage":
        """点击元素（自动等待可见并可点击）。"""
        logger.debug("点击元素：%s", selector)
        self.wait.wait_for_element_visible(self.page, selector, timeout)
        self.locator(selector).click(timeout=timeout or self.config.default_timeout)
        return self

    def fill(self, selector: str, value: str, timeout: Optional[int] = None) -> "BasePage":
        """在输入框中填入文本（自动等待可见）。"""
        logger.debug("填写元素 %s：%s", selector, value)
        self.wait.wait_for_element_visible(self.page, selector, timeout)
        self.locator(selector).fill(str(value), timeout=timeout or self.config.default_timeout)
        return self

    def clear_and_fill(self, selector: str, value: str, timeout: Optional[int] = None) -> "BasePage":
        """清空输入框后填入文本。"""
        self.locator(selector).clear(timeout=timeout or self.config.default_timeout)
        return self.fill(selector, value, timeout)

    def type_text(self, selector: str, value: str, delay: int = 0) -> "BasePage":
        """模拟逐字符输入。"""
        self.locator(selector).type(str(value), delay=delay)
        return self

    def select_option(self, selector: str, value: Optional[str] = None, label: Optional[str] = None) -> "BasePage":
        """选择下拉框选项（按 value 或 label）。"""
        if value is not None:
            self.locator(selector).select_option(value=value)
        elif label is not None:
            self.locator(selector).select_option(label=label)
        else:
            raise ValueError("select_option 需要指定 value 或 label")
        return self

    def check(self, selector: str) -> "BasePage":
        """勾选复选框（已勾选则跳过）。"""
        self.locator(selector).check()
        return self

    def uncheck(self, selector: str) -> "BasePage":
        """取消勾选复选框。"""
        self.locator(selector).uncheck()
        return self

    def hover(self, selector: str) -> "BasePage":
        """鼠标悬停。"""
        self.locator(selector).hover()
        return self

    def scroll_to(self, selector: str) -> "BasePage":
        """滚动到元素位置。"""
        self.locator(selector).scroll_into_view_if_needed()
        return self

    def press_key(self, selector: str, key: str) -> "BasePage":
        """在指定元素上按键，如 ``Enter``。"""
        self.locator(selector).press(key)
        return self

    def upload_file(self, selector: str, file_path: str) -> "BasePage":
        """上传文件。"""
        self.locator(selector).set_input_files(file_path)
        return self

    # ------------------------------------------------------------------
    # 元素读取
    # ------------------------------------------------------------------
    def get_text(self, selector: str, timeout: Optional[int] = None) -> str:
        """获取元素文本（自动去空白）。"""
        self.wait.wait_for_element_visible(self.page, selector, timeout)
        return (self.locator(selector).inner_text() or "").strip()

    def get_input_value(self, selector: str) -> str:
        """获取输入框当前值。"""
        return self.locator(selector).input_value()

    def get_attribute(self, selector: str, attribute: str) -> Optional[str]:
        """获取元素属性值。"""
        return self.locator(selector).get_attribute(attribute)

    def count(self, selector: str) -> int:
        """统计匹配元素数量。"""
        return self.page.locator(selector).count()

    def is_visible(self, selector: str, timeout: Optional[int] = 2000) -> bool:
        """判断元素是否可见（超时内不可见返回 False，不抛异常）。"""
        try:
            self.wait.wait_for_element_visible(self.page, selector, timeout)
            return True
        except Exception:
            return False

    def is_enabled(self, selector: str) -> bool:
        """判断元素是否可用。"""
        return self.locator(selector).is_enabled()

    def is_checked(self, selector: str) -> bool:
        """判断复选框是否被勾选。"""
        return self.locator(selector).is_checked()

    # ------------------------------------------------------------------
    # 重试
    # ------------------------------------------------------------------
    def retry_action(self, action, attempts: int = 3, delay_ms: int = 500):
        """执行动作并在失败时重试。

        Args:
            action: 无参可调用对象。
            attempts: 最大尝试次数。
            delay_ms: 每次失败后的等待毫秒数。

        Returns:
            ``action`` 的返回值。

        Raises:
            Exception: 达到最大次数仍失败时抛出最后一次异常。
        """
        last_error: Optional[Exception] = None
        for attempt in range(1, attempts + 1):
            try:
                return action()
            except Exception as exc:
                last_error = exc
                logger.warning("动作失败（第 %s/%s 次）：%s", attempt, attempts, exc)
                if attempt < attempts:
                    self.page.wait_for_timeout(delay_ms)
        raise last_error  # type: ignore[misc]

    def retry_click(self, selector: str, attempts: int = 3, delay_ms: int = 500) -> "BasePage":
        """带重试的点击。"""
        self.retry_action(lambda: self.click(selector), attempts=attempts, delay_ms=delay_ms)
        return self

    def retry_fill(self, selector: str, value: str, attempts: int = 3, delay_ms: int = 500) -> "BasePage":
        """带重试的填写。"""
        self.retry_action(lambda: self.fill(selector, value), attempts=attempts, delay_ms=delay_ms)
        return self

    # ------------------------------------------------------------------
    # 等待
    # ------------------------------------------------------------------
    def wait_for_visible(self, selector: str, timeout: Optional[int] = None) -> "BasePage":
        """等待元素可见。"""
        self.wait.wait_for_element_visible(self.page, selector, timeout)
        return self

    def wait_for_hidden(self, selector: str, timeout: Optional[int] = None) -> "BasePage":
        """等待元素隐藏。"""
        self.wait.wait_for_element_hidden(self.page, selector, timeout)
        return self

    def wait_for_network_idle(self, timeout: Optional[int] = None) -> "BasePage":
        """等待网络空闲。"""
        self.wait.wait_for_network_idle(self.page, timeout)
        return self

    # ------------------------------------------------------------------
    # 断言
    # ------------------------------------------------------------------
    def assert_url_contains(self, fragment: str) -> "BasePage":
        """断言当前 URL 包含指定片段。"""
        assert_that(self.page.url).described_as("URL 断言失败").contains(fragment)
        return self

    def assert_title_contains(self, fragment: str) -> "BasePage":
        """断言页面标题包含指定文本。"""
        assert_that(self.page.title()).described_as("标题断言失败").contains(fragment)
        return self

    def assert_element_visible(self, selector: str, timeout: Optional[int] = None) -> "BasePage":
        """断言元素可见。"""
        self.wait.wait_for_element_visible(self.page, selector, timeout)
        assert_that(self.locator(selector).is_visible()).described_as(
            f"元素应可见：{selector}"
        ).is_true()
        return self

    def assert_element_not_visible(self, selector: str) -> "BasePage":
        """断言元素不可见。"""
        assert_that(self.is_visible(selector)).described_as(f"元素应不可见：{selector}").is_false()
        return self

    def assert_element_text(self, selector: str, expected: str) -> "BasePage":
        """断言元素文本完全等于 ``expected``。"""
        assert_that(self.get_text(selector)).described_as(f"元素文本断言失败：{selector}").is_equal_to(
            expected
        )
        return self

    def assert_element_contains_text(self, selector: str, expected: str) -> "BasePage":
        """断言元素文本包含 ``expected``。"""
        assert_that(self.get_text(selector)).described_as(f"元素文本断言失败：{selector}").contains(
            expected
        )
        return self

    def assert_input_value(self, selector: str, expected: str) -> "BasePage":
        """断言输入框的值等于 ``expected``。"""
        assert_that(self.get_input_value(selector)).described_as(
            f"输入框取值断言失败：{selector}"
        ).is_equal_to(expected)
        return self

    def take_screenshot(self, name: str = "page") -> None:
        """对当前页面截图。"""
        from core.browser_factory import BrowserFactory

        BrowserFactory().take_screenshot(name)


__all__ = ["BasePage"]
