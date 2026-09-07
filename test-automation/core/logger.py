"""日志工具模块。

提供统一的 logger 工厂与敏感数据脱敏函数，避免 token / 密码等落入日志。
"""

from __future__ import annotations

import logging
import sys
from typing import Any, Dict, Iterable, List, Optional, Union

DEFAULT_FORMAT = "%(asctime)s [%(levelname)-8s] %(name)s: %(message)s"
DEFAULT_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# 命中这些键名（忽略大小写与下划线）时，值会被替换为 ***
SENSITIVE_KEYS: Iterable[str] = (
    "password",
    "passwd",
    "pwd",
    "secret",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "auth",
    "cookie",
    "set_cookie",
    "session",
    "sid",
    "api_key",
    "apikey",
    "private_key",
)

MASK = "***"

_configured = False


def _normalize(key: str) -> str:
    """归一化键名：转小写并去掉下划线与连字符，便于模糊匹配。"""
    return key.lower().replace("_", "").replace("-", "")


def mask_sensitive_data(data: Union[Dict[str, Any], List[Any], str, None]) -> Union[Dict[str, Any], List[Any], str, None]:
    """脱敏敏感数据。

    递归遍历 dict / list，命中 ``SENSITIVE_KEYS`` 的键值替换为 ``***``。

    Args:
        data: 待脱敏的数据，支持 dict、list、str 与 None。

    Returns:
        与入参同类型的脱敏副本；不支持的类型原样返回。

    Example:
        >>> mask_sensitive_data({"password": "123456", "user": "zhinv"})
        {'password': '***', 'user': 'zhinv'}
    """
    if data is None or isinstance(data, (int, float, bool)):
        return data

    if isinstance(data, str):
        return data

    if isinstance(data, dict):
        masked: Dict[str, Any] = {}
        sensitive_names = {_normalize(k) for k in SENSITIVE_KEYS}
        for key, value in data.items():
            if isinstance(key, str) and _normalize(key) in sensitive_names:
                masked[key] = MASK
            else:
                masked[key] = mask_sensitive_data(value)
        return masked

    if isinstance(data, (list, tuple)):
        masked_list = [mask_sensitive_data(item) for item in data]
        return type(data)(masked_list) if isinstance(data, tuple) else masked_list

    return data


def _configure_root_logger(level: str) -> None:
    """配置根 logger（仅执行一次）。"""
    global _configured
    if _configured:
        return

    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    if not root.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(DEFAULT_FORMAT, datefmt=DEFAULT_DATE_FORMAT))
        root.addHandler(handler)

    _configured = True


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """获取 logger。

    Args:
        name: logger 名称，通常使用 ``__name__``；为空时返回根 logger。

    Returns:
        已按配置设置好级别的 ``logging.Logger``。
    """
    try:
        from core.config import Config

        _configure_root_logger(Config().log_level)
    except Exception:  # pragma: no cover - 配置不可用时不阻断取 logger
        _configure_root_logger("INFO")

    return logging.getLogger(name)


__all__ = ["get_logger", "mask_sensitive_data", "SENSITIVE_KEYS"]
