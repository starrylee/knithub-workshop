"""HTTP 响应校验器。

封装 ``requests.Response``，提供链式断言方法，供 Step Definitions 使用。
"""

from __future__ import annotations

from typing import Any, Optional

import requests
from assertpy import assert_that

from core.logger import get_logger, mask_sensitive_data

logger = get_logger(__name__)


class ResponseValidator:
    """响应校验器。

    Example:
        >>> validator = ResponseValidator(response)
        >>> validator.assert_status_code(200).assert_json_field("username", "zhinv")
    """

    def __init__(self, response: requests.Response) -> None:
        """初始化。

        Args:
            response: 待校验的 ``requests.Response``。
        """
        self.response = response
        self._json_cache: Optional[Any] = None
        self._json_parsed = False

    # ------------------------------------------------------------------
    # 基础属性
    # ------------------------------------------------------------------
    @property
    def status_code(self) -> int:
        """HTTP 状态码。"""
        return self.response.status_code

    @property
    def headers(self):
        """响应头。"""
        return self.response.headers

    @property
    def text(self) -> str:
        """响应体原始文本。"""
        return self.response.text

    @property
    def elapsed_seconds(self) -> float:
        """响应耗时（秒）。"""
        return self.response.elapsed.total_seconds()

    @property
    def json(self) -> Any:
        """解析后的 JSON 响应体（带缓存）。

        Raises:
            ValueError: 响应体不是合法 JSON。
        """
        if not self._json_parsed:
            try:
                self._json_cache = self.response.json()
            except Exception as exc:
                raise ValueError(
                    f"响应体不是合法 JSON（status={self.status_code}）：{self.text[:500]}"
                ) from exc
            self._json_parsed = True
        return self._json_cache

    def get_field(self, field_name: str, raise_on_missing: bool = True) -> Any:
        """获取 JSON 响应体字段，支持 ``a.b.c`` 形式的点号路径与 ``items[0].id`` 索引。

        Args:
            field_name: 字段名或点号路径。
            raise_on_missing: 字段缺失时是否抛出 AssertionError。

        Returns:
            字段值；字段缺失且 ``raise_on_missing=False`` 时返回 None。
        """
        value: Any = self.json
        for part in field_name.split("."):
            if value is None:
                break

            name, _, index_part = part.partition("[")
            if name:
                if isinstance(value, dict) and name in value:
                    value = value[name]
                else:
                    value = None
                    break

            while index_part:
                index_str, _, index_part = index_part.partition("]")
                index_part = index_part.lstrip(".[")
                try:
                    index = int(index_str)
                except ValueError:
                    value = None
                    break
                value = value[index] if isinstance(value, list) and index < len(value) else None
                if value is None:
                    break

        if value is None and raise_on_missing:
            raise AssertionError(
                f"响应中缺少字段 '{field_name}'（status={self.status_code}，body={self.text[:500]}）"
            )
        return value

    # ------------------------------------------------------------------
    # 断言方法（返回 self 以支持链式调用）
    # ------------------------------------------------------------------
    def assert_status_code(self, expected: int) -> "ResponseValidator":
        """断言状态码等于 ``expected``。"""
        assert_that(self.status_code).described_as(
            f"状态码断言失败，响应体：{self.text[:500]}"
        ).is_equal_to(expected)
        logger.debug("状态码断言通过：%s", expected)
        return self

    def assert_status_code_in(self, *expected: int) -> "ResponseValidator":
        """断言状态码属于给定集合。"""
        assert_that(self.status_code).described_as(
            f"状态码断言失败，响应体：{self.text[:500]}"
        ).is_in(*expected)
        return self

    def assert_json_field(self, field: str, value: Any) -> "ResponseValidator":
        """断言 JSON 字段值等于 ``value``。"""
        actual = self.get_field(field)
        assert_that(actual).described_as(f"字段 '{field}' 断言失败").is_equal_to(value)
        logger.debug("字段断言通过：%s = %s", field, mask_sensitive_data(value))
        return self

    def assert_json_contains(self, **expected: Any) -> "ResponseValidator":
        """断言 JSON 顶层包含给定的键值对。"""
        for key, value in expected.items():
            self.assert_json_field(key, value)
        return self

    def assert_field_not_none(self, field: str) -> "ResponseValidator":
        """断言 JSON 字段存在且不为 None。"""
        assert_that(self.get_field(field)).described_as(f"字段 '{field}' 不应为 None").is_not_none()
        return self

    def assert_response_time(self, max_seconds: float) -> "ResponseValidator":
        """断言响应时间不超过 ``max_seconds`` 秒。"""
        assert_that(self.elapsed_seconds).described_as("响应时间超出阈值").is_less_than_or_equal_to(
            max_seconds
        )
        logger.debug("响应时间断言通过：%.3fs <= %ss", self.elapsed_seconds, max_seconds)
        return self

    def __repr__(self) -> str:  # pragma: no cover - 调试用途
        return f"ResponseValidator(status={self.status_code})"


__all__ = ["ResponseValidator"]
