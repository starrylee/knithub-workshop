"""用户登录 API 层（FT-01-US-02）的 Step Definitions。

覆盖 features/api/user-login.api.feature：接口契约（@api:contract）、
字段边界（@api:boundary）、错误码（@api:error）三类场景。

数据准备策略说明：
- 后端注册接口 POST /api/v1/auth/register 尚未交付（FT-01-US-01 TODO），
  Given「存在如下注册用户」为校验式实现——断言声明的用户已存在于
  server/data/users.json 种子数据，而非通过 API 创建；
- password 列为明文声明，仅作文档用途（存储为 BCrypt 单向哈希，不可逆校验）。
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from assertpy import assert_that
from behave import given, then, when

from core.api_client import APIClient
from core.config import Config
from core.logger import get_logger
from core.response_validator import ResponseValidator

logger = get_logger(__name__)

# 用户 JSON 存储文件定位：优先读环境变量 USERS_DATA_FILE（.env 可配），
# 未配置时回退到测试项目同仓库的后端种子数据默认路径。
_USERS_DATA_FILE_ENV_KEY = "USERS_DATA_FILE"
_DEFAULT_USERS_DATA_FILE = (
    Path(__file__).resolve().parent.parent.parent / "server" / "data" / "users.json"
)


def _resolve_users_data_file() -> Path:
    """解析后端用户存储文件路径（相对路径相对运行目录解析）。"""
    configured = Config().get(_USERS_DATA_FILE_ENV_KEY)
    return Path(configured) if configured else _DEFAULT_USERS_DATA_FILE


# ======================================================================
# Given：前置条件与数据准备
# ======================================================================
@given('请求基础地址为 "{base_url}"')
def step_set_request_base_url(context, base_url):
    """以 feature 声明的基础地址重建 API 客户端。

    .env 的 API_BASE_URL 可能带 /api/v1 前缀（见 .env.example），而本 feature
    的请求路径均含完整 /api/v1 前缀——以 feature 声明为准重建客户端，
    避免前缀双重拼接。
    """
    APIClient.reset()
    context.api_client = APIClient(base_url=base_url)
    logger.info("API 请求基础地址已设置为：%s", base_url)


@given('请求认证状态为 "{auth_state}"')
def step_set_auth_state(context, auth_state):
    """确保请求以指定认证状态发出（清理 Token 与 Cookie）。"""
    if auth_state == "未登录":
        context.api_client.clear_token()
        context.api_client.clear_cookies()
        logger.info("请求认证状态：未登录（已清理 Token 与 Cookie）")
    else:
        raise NotImplementedError(
            f"暂不支持的认证状态：{auth_state}（当前仅实现「未登录」）"
        )


@given('存在如下注册用户')
def step_verify_registered_users_exist(context):
    """校验声明的用户已存在于后端用户存储（校验式数据准备）。

    按username 精确匹配查找用户后，断言 id / display_name / avatar 与声明
    一致；password 列不校验（存储为 BCrypt 单向哈希，无法由明文核验）。
    用户不存在时给出可操作的修复提示（加入种子数据）。
    """
    data_file = _resolve_users_data_file()
    assert_that(data_file.exists()).described_as(
        f"后端用户存储文件不存在：{data_file}。"
        f"可通过环境变量 {_USERS_DATA_FILE_ENV_KEY} 指定实际路径。"
    ).is_true()

    stored_users: List[Dict[str, Any]] = json.loads(
        data_file.read_text(encoding="utf-8")
    )

    for row in context.table:
        username = row["username"]
        matched = next(
            (user for user in stored_users if user.get("username") == username),
            None,
        )
        assert_that(matched).described_as(
            f"用户 '{username}' 不存在于 {data_file}。"
            "注册接口尚未交付（FT-01-US-01 TODO），"
            "请将该用户手工加入 server/data/users.json 种子数据后重试。"
        ).is_not_none()

        assert_that(matched["id"]).described_as(
            f"用户 '{username}' 的 id 与种子数据不一致"
        ).is_equal_to(int(row["id"]))
        assert_that(matched["display_name"]).described_as(
            f"用户 '{username}' 的 display_name 与种子数据不一致"
        ).is_equal_to(row["display_name"])
        assert_that(matched["avatar"]).described_as(
            f"用户 '{username}' 的 avatar 与种子数据不一致"
        ).is_equal_to(row["avatar"])

    logger.info(
        "注册用户存在性校验通过：%d 个用户（数据文件：%s）",
        len(context.table.rows),
        data_file,
    )


# ======================================================================
# When：用户操作 / 触发动作
# ======================================================================
@when('发送 POST 请求 "{path}"，请求体如下')
def step_send_post_request_with_body(context, path):
    """以 docstring 中的 JSON 为请求体发送 POST 请求。"""
    payload = json.loads(context.text)
    response = context.api_client.post(path, json_body=payload)
    context.response = response
    context.validator = ResponseValidator(response)
    logger.info("POST %s → %s", path, response.status_code)


# ======================================================================
# Then：断言 / 验证
# ======================================================================
@then('响应状态码为 {status_code:d}')
def step_assert_response_status_code(context, status_code):
    """断言响应状态码等于期望值。"""
    context.validator.assert_status_code(status_code)


@then('返回如下用户信息')
def step_assert_user_info_response(context):
    """断言响应体与期望的用户信息完全一致（整体相等）。

    整体相等断言同时保证两点：期望字段全部匹配；不出现期望之外的任何
    字段——即 password_hash 泄漏到响应体会被此断言捕获（技术方案 5.5）。
    """
    expected = json.loads(context.text)
    actual = context.validator.json
    assert_that(actual).described_as(
        "响应体与期望的用户信息不一致（不允许出现期望之外的字段，"
        f"如 passwordHash）。实际响应：{context.response.text[:500]}"
    ).is_equal_to(expected)


@then('响应头 Set-Cookie 包含 "{fragment}"')
def step_assert_set_cookie_contains(context, fragment):
    """断言响应头 Set-Cookie 包含指定片段（如 sid=、HttpOnly、Max-Age=604800）。"""
    set_cookie = context.response.headers.get("Set-Cookie", "")
    assert_that(set_cookie).described_as(
        f"响应头 Set-Cookie 不包含 '{fragment}'。实际 Set-Cookie：{set_cookie}"
    ).contains(fragment)


@then('返回如下错误信息')
def step_assert_error_message_response(context):
    """断言响应体与期望的错误信息完全一致（整体相等）。"""
    expected = json.loads(context.text)
    actual = context.validator.json
    assert_that(actual).described_as(
        f"响应体与期望的错误信息不一致。实际响应：{context.response.text[:500]}"
    ).is_equal_to(expected)
