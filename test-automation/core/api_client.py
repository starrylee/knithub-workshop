"""HTTP API 客户端。

基于 ``requests.Session`` 封装，提供连接池复用、重试策略、Token/Cookie 管理
与脱敏的请求响应日志，供 `steps/` 与 `services/` 层调用。
"""

from __future__ import annotations

import json
import time
from typing import Any, Dict, Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from core.config import Config
from core.logger import get_logger, mask_sensitive_data

logger = get_logger(__name__)

# 触发重试的状态码（5xx 与 429 视为可恢复）
RETRY_STATUS_FORCELIST = (429, 500, 502, 503, 504)
# 触发重试的 HTTP 方法
RETRY_ALLOWED_METHODS = ("GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS")


class APIClient:
    """API 客户端单例。

    Example:
        >>> client = APIClient()
        >>> response = client.post("/auth/login", json={"username": "zhinv", "password": "zhinv123"})
        >>> client.set_token(response.json()["token"])
        >>> client.get("/projects")
    """

    _instance: Optional["APIClient"] = None

    def __new__(cls, *args: Any, **kwargs: Any) -> "APIClient":
        """返回唯一实例。

        Python 会把构造参数同时传给 ``__new__`` 与 ``__init__``；本方法
        仅负责单例控制，参数由 ``__init__`` 消费，故在此原样收下并忽略。
        """
        if cls._instance is None:
            instance = super().__new__(cls)
            instance._initialized = False
            cls._instance = instance
        return cls._instance

    def __init__(self, base_url: Optional[str] = None) -> None:
        """初始化 Session 与重试策略。重复调用不会重复初始化。"""
        if getattr(self, "_initialized", False):
            return

        self.config = Config()
        self.base_url: str = (base_url or self.config.api_base_url).rstrip("/")
        self.timeout: float = float(self.config.get_int("DEFAULT_TIMEOUT", 30000)) / 1000.0
        self._token: Optional[str] = None

        self.session = requests.Session()
        self._mount_retry_adapter()

        self.session.headers.update(
            {
                "Accept": "application/json",
                "Content-Type": "application/json",
            }
        )

        self._initialized = True
        logger.info("APIClient 初始化完成，base_url=%s", self.base_url)

    # ------------------------------------------------------------------
    # 基础设施
    # ------------------------------------------------------------------
    def _mount_retry_adapter(self) -> None:
        """为 http/https 挂载带重试的适配器。"""
        retry = Retry(
            total=self.config.get_int("API_RETRY_TOTAL", 3),
            connect=self.config.get_int("API_RETRY_CONNECT", 3),
            read=self.config.get_int("API_RETRY_READ", 3),
            status=self.config.get_int("API_RETRY_STATUS", 3),
            backoff_factor=float(self.config.get("API_RETRY_BACKOFF", "0.5") or 0.5),
            status_forcelist=RETRY_STATUS_FORCELIST,
            allowed_methods=RETRY_ALLOWED_METHODS,
            raise_on_status=False,
        )
        adapter = HTTPAdapter(
            max_retries=retry,
            pool_connections=self.config.get_int("API_POOL_CONNECTIONS", 10),
            pool_maxsize=self.config.get_int("API_POOL_MAXSIZE", 10),
        )
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def build_url(self, path: str) -> str:
        """拼接完整 URL。

        ``path`` 以 ``http://`` / ``https://`` 开头时原样返回，否则与 base_url 拼接。
        """
        if path.startswith(("http://", "https://")):
            return path
        return f"{self.base_url}/{path.lstrip('/')}"

    # ------------------------------------------------------------------
    # Token / Cookie 管理
    # ------------------------------------------------------------------
    def set_token(self, token: str, scheme: str = "Bearer") -> None:
        """设置鉴权 Token，自动写入 ``Authorization`` 头。"""
        self._token = token
        self.session.headers["Authorization"] = f"{scheme} {token}" if scheme else token
        logger.debug("已设置 Authorization 头（scheme=%s）", scheme)

    def clear_token(self) -> None:
        """清除鉴权 Token。"""
        self._token = None
        self.session.headers.pop("Authorization", None)

    @property
    def token(self) -> Optional[str]:
        """当前生效的 Token（未设置时为 None）。"""
        return self._token

    def set_cookie(self, name: str, value: str, **kwargs: Any) -> None:
        """设置会话 Cookie（如被测系统的 ``sid``）。"""
        self.session.cookies.set(name, value, **kwargs)
        logger.debug("已设置 Cookie：%s", name)

    def get_cookie(self, name: str) -> Optional[str]:
        """读取会话 Cookie 值。"""
        return self.session.cookies.get(name)

    def clear_cookies(self) -> None:
        """清空所有会话 Cookie。"""
        self.session.cookies.clear()
        logger.debug("已清空会话 Cookie")

    def set_header(self, name: str, value: str) -> None:
        """设置自定义请求头。"""
        self.session.headers[name] = value

    def remove_header(self, name: str) -> None:
        """移除请求头。"""
        self.session.headers.pop(name, None)

    # ------------------------------------------------------------------
    # 请求核心
    # ------------------------------------------------------------------
    def request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json_body: Optional[Any] = None,
        data: Optional[Any] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: Optional[float] = None,
        **kwargs: Any,
    ) -> requests.Response:
        """发送 HTTP 请求。

        Args:
            method: HTTP 方法。
            path: 相对路径或完整 URL。
            params: URL 查询参数。
            json_body: 以 JSON 发送的请求体。
            data: 表单/原始请求体。
            headers: 单次请求额外的请求头。
            timeout: 超时秒数，缺省使用配置值。
            **kwargs: 透传给 ``requests.Session.request`` 的其它参数。

        Returns:
            ``requests.Response`` 对象。
        """
        url = self.build_url(path)
        log_payload = mask_sensitive_data(json_body if json_body is not None else data)

        if self.config.log_api_requests:
            logger.info("→ %s %s | params=%s | body=%s", method.upper(), url, params, log_payload)

        start = time.time()
        response = self.session.request(
            method=method.upper(),
            url=url,
            params=params,
            json=json_body,
            data=data,
            headers=headers,
            timeout=timeout or self.timeout,
            **kwargs,
        )
        elapsed = time.time() - start

        if self.config.log_api_responses:
            logger.info(
                "← %s %s | status=%s | %.3fs | body=%s",
                method.upper(),
                url,
                response.status_code,
                elapsed,
                self._safe_body(response),
            )

        return response

    @staticmethod
    def _safe_body(response: requests.Response, limit: int = 2000) -> Any:
        """解析响应体用于日志（脱敏 + 截断），解析失败时返回原始文本。"""
        try:
            body = response.json()
        except (ValueError, json.JSONDecodeError):
            return (response.text or "")[:limit]
        return mask_sensitive_data(body)

    # ------------------------------------------------------------------
    # HTTP 方法快捷封装
    # ------------------------------------------------------------------
    def get(self, path: str, params: Optional[Dict[str, Any]] = None, **kwargs: Any) -> requests.Response:
        """发送 GET 请求。"""
        return self.request("GET", path, params=params, **kwargs)

    def post(self, path: str, json_body: Optional[Any] = None, **kwargs: Any) -> requests.Response:
        """发送 POST 请求。"""
        return self.request("POST", path, json_body=json_body, **kwargs)

    def put(self, path: str, json_body: Optional[Any] = None, **kwargs: Any) -> requests.Response:
        """发送 PUT 请求。"""
        return self.request("PUT", path, json_body=json_body, **kwargs)

    def patch(self, path: str, json_body: Optional[Any] = None, **kwargs: Any) -> requests.Response:
        """发送 PATCH 请求。"""
        return self.request("PATCH", path, json_body=json_body, **kwargs)

    def delete(self, path: str, **kwargs: Any) -> requests.Response:
        """发送 DELETE 请求。"""
        return self.request("DELETE", path, **kwargs)

    # ------------------------------------------------------------------
    # 生命周期
    # ------------------------------------------------------------------
    def close(self) -> None:
        """关闭会话。"""
        self.session.close()
        logger.debug("APIClient 会话已关闭")

    @classmethod
    def reset(cls) -> None:
        """重置单例，用于测试隔离（关闭旧会话并丢弃实例）。

        应在 ``before_scenario`` 中调用，确保场景之间不共享 Token / Cookie。
        """
        if cls._instance is not None:
            try:
                cls._instance.close()
            except Exception as exc:  # pragma: no cover - 关闭失败不应阻断测试
                logger.warning("关闭 APIClient 会话失败：%s", exc)
        cls._instance = None


__all__ = ["APIClient"]
