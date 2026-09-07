"""测试框架配置模块。

从项目根目录的 `.env` 文件加载配置，并以单例形式对外提供类型安全的读取方法。
所有模块统一通过 ``Config()`` 获取配置，禁止直接读取 ``os.environ``。
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv


class Config:
    """配置单例。

    首次实例化时加载 `.env`（若存在），之后重复实例化返回同一份配置。
    环境变量优先级高于 `.env` 文件中的同名键，便于 CI 通过环境变量覆盖。

    Example:
        >>> config = Config()
        >>> config.base_url
        'http://localhost:5174'
    """

    _instance: Optional["Config"] = None

    # 布尔值的真值字面量
    _TRUE_VALUES = {"1", "true", "yes", "y", "on"}

    def __new__(cls, env_file: Optional[str] = None) -> "Config":
        """返回唯一实例（首次创建时记录初始化参数）。"""
        if cls._instance is None:
            instance = super().__new__(cls)
            instance._initialized = False
            instance._pending_env_file = env_file
            cls._instance = instance
        return cls._instance

    def __init__(self, env_file: Optional[str] = None) -> None:
        """加载配置。重复调用不会重复加载。"""
        if getattr(self, "_initialized", False):
            return

        self.project_root: Path = Path(__file__).resolve().parent.parent
        env_path = Path(env_file) if env_file else self.project_root / ".env"
        self.env_file: Path = env_path

        if env_path.exists():
            # override=False：已存在的环境变量优先，CI 注入的值不被 .env 覆盖
            load_dotenv(env_path, override=False)

        self._initialized = True

    # ------------------------------------------------------------------
    # 通用读取方法
    # ------------------------------------------------------------------
    def get(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """读取字符串配置，缺失时返回 ``default``。"""
        return os.environ.get(key, default)

    def get_required(self, key: str) -> str:
        """读取必填配置，缺失时抛出 ``ValueError``。

        Raises:
            ValueError: 配置项不存在。
        """
        value = os.environ.get(key)
        if value is None or value == "":
            raise ValueError(
                f"缺少必填配置项：{key}。请复制 .env.example 为 .env 并填写，"
                f"或通过环境变量注入（当前查找的 .env 路径：{self.env_file}）。"
            )
        return value

    def get_int(self, key: str, default: int = 0) -> int:
        """读取整数配置，解析失败时返回 ``default``。"""
        raw = os.environ.get(key)
        if raw is None or raw == "":
            return default
        try:
            return int(raw)
        except ValueError:
            return default

    def get_bool(self, key: str, default: bool = False) -> bool:
        """读取布尔配置。

        真值字面量（忽略大小写）：``1/true/yes/y/on``，其余视为假。
        """
        raw = os.environ.get(key)
        if raw is None or raw == "":
            return default
        return raw.strip().lower() in self._TRUE_VALUES

    def get_list(self, key: str, default: Optional[List[str]] = None, separator: str = ",") -> List[str]:
        """读取列表配置，按 ``separator`` 切分并去除空白项。"""
        raw = os.environ.get(key)
        if raw is None or raw == "":
            return list(default) if default is not None else []
        return [item.strip() for item in raw.split(separator) if item.strip()]

    # ------------------------------------------------------------------
    # 被测系统
    # ------------------------------------------------------------------
    @property
    def base_url(self) -> str:
        """UI 测试的被测系统根地址（去掉结尾斜杠）。"""
        return self.get_required("BASE_URL").rstrip("/")

    @property
    def api_base_url(self) -> str:
        """API 测试的根地址（去掉结尾斜杠）。"""
        return self.get_required("API_BASE_URL").rstrip("/")

    # ------------------------------------------------------------------
    # 浏览器
    # ------------------------------------------------------------------
    @property
    def browser(self) -> str:
        """浏览器类型：chromium / firefox / webkit。"""
        return self.get("BROWSER", "chromium") or "chromium"

    @property
    def headless(self) -> bool:
        """是否无头模式运行。"""
        return self.get_bool("HEADLESS", True)

    @property
    def slow_mo(self) -> int:
        """Playwright slow_mo（毫秒），用于人工观察时放慢操作。"""
        return self.get_int("SLOW_MO", 0)

    @property
    def default_timeout(self) -> int:
        """默认元素超时（毫秒）。"""
        return self.get_int("DEFAULT_TIMEOUT", 30000)

    @property
    def navigation_timeout(self) -> int:
        """页面导航超时（毫秒）。"""
        return self.get_int("NAVIGATION_TIMEOUT", 60000)

    @property
    def viewport_width(self) -> int:
        """浏览器视口宽度。"""
        return self.get_int("VIEWPORT_WIDTH", 1920)

    @property
    def viewport_height(self) -> int:
        """浏览器视口高度。"""
        return self.get_int("VIEWPORT_HEIGHT", 1080)

    @property
    def viewport(self) -> dict:
        """Playwright 视口字典。"""
        return {"width": self.viewport_width, "height": self.viewport_height}

    # ------------------------------------------------------------------
    # 截图与日志
    # ------------------------------------------------------------------
    @property
    def screenshot_on_failure(self) -> bool:
        """场景失败时是否自动截图。"""
        return self.get_bool("SCREENSHOT_ON_FAILURE", True)

    @property
    def screenshot_dir(self) -> Path:
        """截图输出目录（绝对路径，不存在时自动创建）。"""
        raw = self.get("SCREENSHOT_DIR", "reports/screenshots") or "reports/screenshots"
        path = Path(raw)
        if not path.is_absolute():
            path = self.project_root / path
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def log_level(self) -> str:
        """日志级别。"""
        return (self.get("LOG_LEVEL", "INFO") or "INFO").upper()

    @property
    def log_api_requests(self) -> bool:
        """是否记录 API 请求日志。"""
        return self.get_bool("LOG_API_REQUESTS", True)

    @property
    def log_api_responses(self) -> bool:
        """是否记录 API 响应日志。"""
        return self.get_bool("LOG_API_RESPONSES", True)

    # ------------------------------------------------------------------
    # 凭据
    # ------------------------------------------------------------------
    @property
    def admin_username(self) -> str:
        """管理员账号用户名。"""
        return self.get("ADMIN_USERNAME", "admin") or "admin"

    @property
    def admin_password(self) -> str:
        """管理员账号密码。"""
        return self.get("ADMIN_PASSWORD", "password123") or "password123"

    # ------------------------------------------------------------------
    # 生命周期
    # ------------------------------------------------------------------
    @classmethod
    def reset(cls) -> None:
        """重置单例（仅供测试隔离使用）。"""
        cls._instance = None

    def as_dict(self) -> dict:
        """导出当前生效配置（用于日志排查，敏感值已脱敏）。"""
        sensitive = {"ADMIN_PASSWORD"}
        data: dict = {}
        for key in sorted(os.environ):
            if key.startswith(("BASE_URL", "API_BASE_URL", "BROWSER", "HEADLESS")):
                data[key] = os.environ[key]
            elif key in {"ADMIN_USERNAME", "ADMIN_PASSWORD", "LOG_LEVEL", "DEFAULT_TIMEOUT"}:
                data[key] = "***" if key in sensitive else os.environ[key]
        return data

    def __repr__(self) -> str:  # pragma: no cover - 调试用途
        return f"Config(env_file={self.env_file}, base_url={self.get('BASE_URL')})"


def get_config() -> "Config":
    """获取配置单例的便捷函数。"""
    return Config()


__all__ = ["Config", "get_config"]
