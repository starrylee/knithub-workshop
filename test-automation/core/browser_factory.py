"""Playwright 浏览器工厂。

按 feature 粒度启动浏览器、按 scenario 粒度创建隔离的 context 与 page，
并提供失败截图能力。
"""

from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from typing import Optional

from core.config import Config
from core.logger import get_logger

logger = get_logger(__name__)


class BrowserFactory:
    """浏览器工厂单例。

    生命周期约定（由 `environment.py` 驱动）：

    - ``before_feature``：``initialize()`` 启动 Playwright 与浏览器
    - ``before_scenario``：``new_page()`` 创建隔离的 context + page
    - ``after_scenario``：``close_context()`` 关闭当前 context
    - ``after_feature``：``close()`` 关闭浏览器与 Playwright
    """

    _instance: Optional["BrowserFactory"] = None

    def __new__(cls) -> "BrowserFactory":
        """返回唯一实例。"""
        if cls._instance is None:
            instance = super().__new__(cls)
            instance._initialized = False
            cls._instance = instance
        return cls._instance

    def __init__(self) -> None:
        """读取配置。浏览器在 ``initialize()`` 中惰性启动。"""
        if getattr(self, "_initialized", False):
            return

        self.config = Config()
        self._playwright = None
        self._browser = None
        self._context = None
        self._page = None
        self._tracing = self.config.get_bool("ENABLE_TRACING", False)
        self._initialized = True

    # ------------------------------------------------------------------
    # 启动与关闭
    # ------------------------------------------------------------------
    def initialize(self) -> "BrowserFactory":
        """启动 Playwright 与浏览器（幂等）。"""
        if self._browser is not None:
            return self

        from playwright.sync_api import sync_playwright  # 延迟导入：API 测试无需依赖 Playwright

        logger.info(
            "启动浏览器：type=%s headless=%s viewport=%sx%s",
            self.config.browser,
            self.config.headless,
            self.config.viewport_width,
            self.config.viewport_height,
        )

        self._playwright = sync_playwright().start()
        launcher = getattr(self._playwright, self.config.browser, None)
        if launcher is None:
            raise ValueError(
                f"不支持的浏览器类型：{self.config.browser}（可选 chromium/firefox/webkit）"
            )

        self._browser = launcher.launch(
            headless=self.config.headless,
            slow_mo=self.config.slow_mo,
        )
        return self

    def new_context(self, **kwargs: "object") -> "object":
        """创建新的浏览器上下文（隔离 cookies / localStorage）。

        Returns:
            Playwright ``BrowserContext`` 对象。
        """
        if self._browser is None:
            self.initialize()

        options = {
            "viewport": self.config.viewport,
            "ignore_https_errors": True,
            "base_url": self.config.base_url,
        }
        options.update(kwargs)

        self._context = self._browser.new_context(**options)
        self._context.set_default_timeout(self.config.default_timeout)
        self._context.set_default_navigation_timeout(self.config.navigation_timeout)

        if self._tracing:
            self._context.tracing.start(screenshots=True, snapshots=True, sources=False)

        logger.debug("已创建新的 browser context")
        return self._context

    def new_page(self, **kwargs: "object") -> "object":
        """创建新的 Page（自动创建 context）。

        Returns:
            Playwright ``Page`` 对象。
        """
        if self._context is None:
            self.new_context(**kwargs)

        self._page = self._context.new_page()
        logger.debug("已创建新的 page")
        return self._page

    @property
    def page(self):
        """当前 Page（尚未创建时为 None）。"""
        return self._page

    @property
    def context(self):
        """当前 BrowserContext（尚未创建时为 None）。"""
        return self._context

    # ------------------------------------------------------------------
    # 截图
    # ------------------------------------------------------------------
    def take_screenshot(self, name: str = "screenshot") -> Optional[Path]:
        """截图并保存到截图目录。

        Args:
            name: 截图文件名（不含扩展名），会被安全化（非法字符替换为 ``_``）。

        Returns:
            截图文件路径；无可用 Page 时返回 None。
        """
        if self._page is None:
            logger.warning("无可用 Page，跳过截图：%s", name)
            return None

        safe_name = re.sub(r"[^\w.\-]+", "_", name).strip("_") or "screenshot"
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        path = self.config.screenshot_dir / f"{safe_name}_{timestamp}.png"

        try:
            self._page.screenshot(path=str(path), full_page=True)
            logger.info("截图已保存：%s", path)
            return path
        except Exception as exc:
            logger.warning("截图失败（%s）：%s", name, exc)
            return None

    # ------------------------------------------------------------------
    # 关闭
    # ------------------------------------------------------------------
    def close_context(self) -> None:
        """关闭当前 context（先停止 tracing 再关闭）。"""
        if self._context is None:
            return

        try:
            if self._tracing:
                trace_path = self.config.screenshot_dir / f"trace_{datetime.now():%Y%m%d_%H%M%S}.zip"
                self._context.tracing.stop(path=str(trace_path))
        except Exception as exc:  # pragma: no cover - tracing 失败不影响主流程
            logger.warning("停止 tracing 失败：%s", exc)

        try:
            self._context.close()
            logger.debug("已关闭 browser context")
        except Exception as exc:
            logger.warning("关闭 browser context 失败：%s", exc)
        finally:
            self._context = None
            self._page = None

    def close(self) -> None:
        """关闭浏览器与 Playwright。"""
        self.close_context()

        if self._browser is not None:
            try:
                self._browser.close()
                logger.info("浏览器已关闭")
            except Exception as exc:  # pragma: no cover
                logger.warning("关闭浏览器失败：%s", exc)
            finally:
                self._browser = None

        if self._playwright is not None:
            try:
                self._playwright.stop()
            except Exception as exc:  # pragma: no cover
                logger.warning("停止 Playwright 失败：%s", exc)
            finally:
                self._playwright = None

    @classmethod
    def reset(cls) -> None:
        """重置单例（关闭资源并丢弃实例），用于测试隔离。"""
        if cls._instance is not None:
            try:
                cls._instance.close()
            except Exception as exc:  # pragma: no cover
                logger.warning("重置 BrowserFactory 失败：%s", exc)
        cls._instance = None


__all__ = ["BrowserFactory"]
