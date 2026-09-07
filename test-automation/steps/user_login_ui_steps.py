"""用户登录 UI 层（FT-01-US-02）的 Step Definitions。

覆盖 features/ui/user-login.feature：正确凭据登录（@AC-1）、统一错误
提示（@AC-2）、前端必填校验（@AC-3），共 6 条 Scenario（每条 AC 各
2 条 PO 认可的实例化示例）。

数据准备策略说明（与 API 层 user_login_api_steps.py 对齐）：
- 后端注册接口 POST /api/v1/auth/register 尚未交付（FT-01-US-01 TODO），
  Given「系统中存在如下注册用户：」为校验式实现——断言声明的用户已存在
  于 server/data/users.json 种子数据，而非通过 API 创建；
- password 列为明文声明，仅作文档用途（存储为 BCrypt 单向哈希，不可逆校验）。

AC-3「未向后端发出登录请求」实现说明：
- Background 导航首页时注册 Playwright request 监听，统计发往
  POST /api/v1/auth/login 的请求数（context.login_request_count），
  Then 步骤据此断言（前端必填校验先行时应为 0）。
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
from pages.notebook_page import NotebookPage

logger = get_logger(__name__)

# 用户 JSON 存储文件定位：优先读环境变量 USERS_DATA_FILE（.env 可配），
# 未配置时回退到测试项目同仓库的后端种子数据默认路径。
_USERS_DATA_FILE_ENV_KEY = "USERS_DATA_FILE"
_DEFAULT_USERS_DATA_FILE = (
    Path(__file__).resolve().parent.parent.parent / "server" / "data" / "users.json"
)

# 登录接口路径片段（前端 fetch 相对路径，经 Vite proxy 透传到后端）
_LOGIN_API_PATH = "/api/v1/auth/login"


def _resolve_users_data_file() -> Path:
    """解析后端用户存储文件路径（相对路径相对运行目录解析）。"""
    configured = Config().get(_USERS_DATA_FILE_ENV_KEY)
    return Path(configured) if configured else _DEFAULT_USERS_DATA_FILE


# ======================================================================
# Given：前置条件与数据准备
# ======================================================================
@given('系统中存在如下注册用户：')
def step_verify_registered_users_exist_ui(context):
    """校验声明的用户已存在于后端用户存储（校验式数据准备）。

    按 username 精确匹配查找用户后，断言 display_name 与声明一致；
    password 列不校验（存储为 BCrypt 单向哈希，无法由明文核验）。
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

        assert_that(matched["display_name"]).described_as(
            f"用户 '{username}' 的 display_name 与种子数据不一致"
        ).is_equal_to(row["displayName"])

    logger.info(
        "注册用户存在性校验通过：%d 个用户（数据文件：%s）",
        len(context.table.rows),
        data_file,
    )


@given('用户处于未登录状态，正在浏览首页 "{path}"')
def step_browse_home_page_as_guest(context, path):
    """以未登录状态导航到首页，并注册登录请求监听。

    - 每个 Scenario 使用独立 browser context（environment.py），
      Cookie / localStorage 天然隔离，无需显式清理登录态
      （AuthContext 亦不持久化，见 AuthContext.tsx useState 初始化）；
    - 注册 request 监听统计 POST /api/v1/auth/login 请求次数，
      供 AC-3「未向后端发出登录请求」断言。
    """
    context.login_request_count = 0

    def _count_login_request(request):
        if request.method == "POST" and _LOGIN_API_PATH in request.url:
            context.login_request_count += 1

    context.page.on("request", _count_login_request)

    context.home_page = HomePage(context.page)
    context.home_page.navigate()
    context.home_page.assert_url_is(path)
    logger.info("已以未登录状态导航至首页：%s", context.page.url)


@given('用户名 "{username}" 从未注册')
def step_verify_username_never_registered(context, username):
    """校验声明的用户名不存在于后端用户存储（防枚举文案场景前置）。"""
    data_file = _resolve_users_data_file()
    stored_users: List[Dict[str, Any]] = json.loads(
        data_file.read_text(encoding="utf-8")
    )

    matched = any(user.get("username") == username for user in stored_users)
    assert_that(matched).described_as(
        f"用户 '{username}' 已存在于 {data_file}，"
        "与「从未注册」前置条件矛盾，请更换用户名或清理种子数据。"
    ).is_false()

    logger.info("用户名从未注册校验通过：%s", username)


# ======================================================================
# When：用户操作
# ======================================================================
@when('用户点击导航栏的"登录 / 注册"按钮，打开标题为"欢迎回来"的登录弹窗')
def step_open_login_modal(context):
    """点击导航栏"登录 / 注册"按钮，断言登录弹窗以"欢迎回来"标题打开。"""
    # 重建 POM 实例使本步骤自包含（不依赖 Background 的实例装配顺序）
    context.home_page = HomePage(context.page)
    context.login_modal = LoginModalPage(context.page)

    context.home_page.open_login_modal()
    context.login_modal.assert_open_with_title("欢迎回来")
    logger.info("登录弹窗已打开（标题：欢迎回来）")


@when('在"用户名"输入框输入 "{username}"')
def step_fill_username(context, username):
    """在弹窗"用户名"输入框填入用户名。"""
    context.login_modal.fill_username(username)


@when('在"密码"输入框输入 "{password}"')
def step_fill_password(context, password):
    """在弹窗"密码"输入框填入密码。"""
    context.login_modal.fill_password(password)


@when('点击"登 录"按钮')
def step_click_login_button(context):
    """点击弹窗"登 录"提交按钮。"""
    context.login_modal.click_submit()
    logger.info("已点击「登 录」按钮")


@when('"用户名"输入框保持留空')
def step_keep_username_empty(context):
    """保持弹窗"用户名"输入框留空（AC-3 前端必填校验前置）。"""
    context.login_modal.keep_username_empty()


@when('"密码"输入框保持留空')
def step_keep_password_empty(context):
    """保持弹窗"密码"输入框留空（AC-3 前端必填校验前置）。"""
    context.login_modal.keep_password_empty()


# ======================================================================
# Then：断言 / 验证
# ======================================================================
@then('登录弹窗关闭，标题"欢迎回来"不再显示')
def step_assert_login_modal_closed(context):
    """断言登录弹窗已关闭（遮罩卸载、标题不再显示）。"""
    context.login_modal.assert_closed()
    logger.info("登录弹窗已关闭断言通过")


@then('导航栏不再显示"登录 / 注册"按钮，改为显示用户名"{display_name}"与"退出"按钮')
def step_assert_navbar_switches_to_logged_in(context, display_name):
    """断言导航栏切换为登录态：登录入口消失，displayName 与"退出"按钮可见。"""
    context.home_page.assert_login_entry_not_visible()
    context.home_page.assert_logged_in_as(display_name)


@then('导航栏改为显示用户名"{display_name}"与"退出"按钮')
def step_assert_navbar_shows_display_name(context, display_name):
    """断言导航栏登录态：displayName 与"退出"按钮可见。"""
    context.home_page.assert_logged_in_as(display_name)


@then('页面导航至个人页 "{path}"，头部展示如下信息：')
def step_assert_navigate_to_notebook_page_with_table(context, path):
    """断言页面导航至个人页，Profile Header 展示表格声明的内容。

    表格按「字段 / 值」两列组织，支持的字段：
    - 显示名称 → 头部 h1 完全相等断言；
    - 用户名（含 @ 前缀）→ 头部 @username 行 contains 断言
      （mock 数据 location 非空时渲染为 "@username · 📍 location"）。
    """
    notebook_page = NotebookPage(context.page)
    notebook_page.assert_url_is_user_page(path)

    expected = {row["字段"]: row["值"] for row in context.table}
    if "显示名称" in expected:
        notebook_page.assert_header_display_name(expected["显示名称"])
    if "用户名" in expected:
        notebook_page.assert_header_username(expected["用户名"])

    logger.info("个人页头部信息断言通过：%s", expected)


@then('页面导航至个人页 "{path}"（存储态用户名），头部显示名称"{display_name}"与用户名"@{username}"')
def step_assert_navigate_to_notebook_page_inline(context, path, display_name, username):
    """断言页面导航至个人页（存储态用户名），头部 displayName 与 @username。

    大小写变体登录场景（FT-01 决策 4）：导航目标取登录响应中的存储态
    用户名（非输入的大小写变体）；@username 行使用 contains 断言
    （mock 数据含 location 后缀）。
    """
    notebook_page = NotebookPage(context.page)
    notebook_page.assert_url_is_user_page(path)
    notebook_page.assert_header_display_name(display_name)
    notebook_page.assert_header_username(f"@{username}")
    logger.info(
        "个人页断言通过：URL=%s，显示名称=%s，用户名=@%s",
        path, display_name, username,
    )


@then('登录弹窗保持打开，弹窗内显示提示信息"{message}"')
def step_assert_modal_open_with_error(context, message):
    """断言登录弹窗保持打开，且错误提示文本完全等于 message。"""
    context.login_modal.assert_still_open()
    context.login_modal.assert_error_message(message)


@then('提示信息不包含"{fragment}"字样')
def step_assert_error_not_contains(context, fragment):
    """断言错误提示不包含 fragment 字样（防用户名枚举文案检查）。"""
    context.login_modal.assert_error_message_not_contains(fragment)


@then('导航栏仍显示"登录 / 注册"按钮，页面停留在首页 "{path}"')
def step_assert_still_on_home_page(context, path):
    """断言导航栏仍为未登录态，页面停留在首页。"""
    context.home_page.assert_login_entry_visible()
    context.home_page.assert_url_is(path)


@then('未向后端发出登录请求')
def step_assert_no_login_request_sent(context):
    """断言全程未向后端发出登录请求（AC-3 前端校验先行）。"""
    count = getattr(context, "login_request_count", None)
    assert_that(count).described_as(
        "登录请求监听未初始化：Background 的「浏览首页」步骤未注册监听"
    ).is_not_none()
    assert_that(count).described_as(
        f"前端必填校验应拦截登录请求，实际发出了 {count} 次 POST {_LOGIN_API_PATH}"
    ).is_equal_to(0)
    logger.info("未向后端发出登录请求断言通过（请求数：0）")
