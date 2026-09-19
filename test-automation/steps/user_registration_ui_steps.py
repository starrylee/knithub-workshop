"""新用户注册 UI 层（FT-01-US-01）的 Step Definitions。

覆盖 features/ui/user-registration.feature 的 AC-1 / AC-2 / AC-3 场景。

数据清理说明：
- 注册会真实写入后端 JSON 存储（server/data/users.json），与登录的「校验式
  数据准备」不同；Given 声明的用户名会登记到 ``context.registered_usernames``，
  由 environment.py 的 after_scenario 统一删除，保证用例可重复执行。
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from assertpy import assert_that
from behave import given, then, when

from core.config import Config
from core.logger import get_logger
from pages.home_page import HomePage
from pages.login_modal import LoginModalPage

logger = get_logger(__name__)

_USERS_DATA_FILE_ENV_KEY = "USERS_DATA_FILE"
_DEFAULT_USERS_DATA_FILE = (
    Path(__file__).resolve().parent.parent.parent / "server" / "data" / "users.json"
)


def _resolve_users_data_file() -> Path:
    """解析后端用户存储文件路径（相对路径相对运行目录解析）。"""
    configured = Config().get(_USERS_DATA_FILE_ENV_KEY)
    return Path(configured) if configured else _DEFAULT_USERS_DATA_FILE


def _read_users() -> List[Dict[str, Any]]:
    data_file = _resolve_users_data_file()
    return json.loads(data_file.read_text(encoding="utf-8"))


# ======================================================================
# Given：前置条件与数据准备
# ======================================================================
@given('待注册的用户名 "{username}" 当前未被占用')
def step_prepare_unused_username(context, username):
    """校验用户名未被注册，并登记为场景结束后需清理的用户。"""
    matched = any(user.get("username") == username for user in _read_users())
    assert_that(matched).described_as(
        f"用户名 '{username}' 已存在于后端存储，与「未被占用」前置矛盾；"
        "若属历史用例残留，请手工删除该用户后重试。"
    ).is_false()

    context.registered_usernames = getattr(context, "registered_usernames", []) + [username]
    logger.info("待注册用户名可用：%s", username)


# ======================================================================
# When：用户操作
# ======================================================================
@when('用户切换到注册 tab，打开标题为"加入 KnitHub"的注册表单')
def step_open_register_tab(context):
    """打开登录弹窗并切换到注册 tab，断言标题切换为「加入 KnitHub」。"""
    context.home_page = HomePage(context.page)
    context.login_modal = LoginModalPage(context.page)

    context.home_page.open_login_modal()
    context.login_modal.switch_to_register_tab()
    context.login_modal.assert_open_with_title("加入 KnitHub")
    logger.info("注册表单已打开（标题：加入 KnitHub）")


@when('在"确认密码"输入框输入 "{password}"')
def step_fill_confirm_password(context, password):
    """在注册表单"确认密码"输入框填入 password（与"密码"一致的二次输入）。"""
    context.login_modal.fill_confirm_password(password)
    logger.info("已填写确认密码")


@when('点击"注 册"按钮')
def step_click_register_button(context):
    """点击弹窗「注 册」提交按钮。"""
    context.login_modal.click_submit()
    logger.info("已点击「注 册」按钮")


# ======================================================================
# Then：断言 / 验证
# ======================================================================
@then('注册弹窗关闭')
def step_assert_register_modal_closed(context):
    """断言注册弹窗已关闭（遮罩卸载、标题不再显示）。"""
    context.login_modal.assert_closed()
    logger.info("注册弹窗已关闭断言通过")


@then('页面停留在首页 "{path}"')
def step_assert_still_on_home_page(context, path):
    """断言注册成功后停留在当前页（决策 14：不跳转个人页）。"""
    context.home_page.assert_url_is(path)
    logger.info("页面停留断言通过：%s", context.page.url)


@then('注册弹窗保持打开，弹窗内显示提示信息"{message}"')
def step_assert_register_modal_open_with_error(context, message):
    """断言注册失败后弹窗保持打开，且提示文本完全等于 message。"""
    context.login_modal.assert_still_open()
    context.login_modal.assert_error_message(message)


@then('"用户名"输入框保留已填内容 "{value}"')
def step_assert_username_kept(context, value):
    """断言注册失败后保留已填用户名（决策 15）。"""
    context.login_modal.assert_username_value(value)


@then('"密码"输入框已清空')
def step_assert_password_cleared(context):
    """断言注册失败后清空密码输入（决策 15）。"""
    context.login_modal.assert_password_empty()
