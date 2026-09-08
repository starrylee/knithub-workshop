"""用户登录 UI 层（FT-01-US-02）的 Step Definitions。

覆盖 ``features/ui/user-login.feature`` 六个场景：正确凭据登录成功（AC-1）、
错误凭据统一提示（AC-2）、空输入前端必填校验（AC-3）。

实现说明：
- UI 步骤使用 Playwright 驱动真实浏览器（Chromium），页面对象位于
  ``pages/login_modal.py`` / ``pages/home_page.py`` / ``pages/notebook_page.py``；
- 每个 Scenario 由 ``environment.py`` 分配隔离的 browser context + page，
  因此「未登录状态」由浏览器上下文天然保证；
- 「未向后端发出登录请求」通过监听 page 的 ``request`` 事件（拦截
  ``/api/v1/auth/login`` 记录到 ``context.login_requests``）断言；
- 「系统中存在如下注册用户」为校验式数据准备：断言用户在
  ``server/data/users.json`` 种子数据中（注册接口尚未交付）。
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List
from urllib.parse import urlparse

from assertpy import assert_that
from behave import given, then, when

from core.config import Config
from core.logger import get_logger
from pages.home_page import HomePage
from pages.login_modal import LoginModal
from pages.notebook_page import NotebookPage

logger = get_logger(__name__)

# 后端用户存储（与 user_login_api_steps 同一路径解析策略）
_DEFAULT_USERS_DATA_FILE = (
    Path(__file__).resolve().parent.parent.parent / "server" / "data" / "users.json"
)


def _load_stored_users() -> List[Dict[str, Any]]:
    """读取后端用户存储（种子）文件。"""
    data_file = Path(Config().get("USERS_DATA_FILE") or _DEFAULT_USERS_DATA_FILE)
    assert_that(data_file.exists()).described_as(
        f"后端用户存储文件不存在：{data_file}。"
        f"可通过环境变量 USERS_DATA_FILE 指定实际路径。"
    ).is_true()
    return json.loads(data_file.read_text(encoding="utf-8"))


def _current_path(page) -> str:
    """取当前页面 URL 的 path 部分。"""
    return urlparse(page.url).path


def _modal(page) -> LoginModal:
    """构造当前页面对应的登录弹窗对象。"""
    return LoginModal(page)


# ======================================================================
# Given：前置条件与数据准备
# ======================================================================
@given('系统中存在如下注册用户：')
def step_registered_users_exist(context):
    """校验声明的用户已存在于后端种子数据（校验式数据准备）。"""
    stored_users = _load_stored_users()

    for row in context.table:
        username = row["username"]
        matched = next(
            (user for user in stored_users if user.get("username") == username), None
        )
        assert_that(matched).described_as(
            f"用户 '{username}' 不存在于后端种子数据，无法用于登录场景。"
        ).is_not_none()
        assert_that(matched["display_name"]).described_as(
            f"用户 '{username}' 的 display_name 与声明不一致"
        ).is_equal_to(row["displayName"])

    logger.info("注册用户存在性校验通过：%d 个用户", len(context.table.rows))


@given('用户处于未登录状态，正在浏览首页 "{path}"')
def step_unauthenticated_at_home(context, path):
    """打开首页（未登录），并挂载登录请求监听。

    - 未登录由每个 Scenario 独立的 browser context 保证（无 Cookie）。
    - ``request`` 监听记录登录接口调用，供 AC-3「未发出请求」断言使用。
    """
    page = context.page
    assert_that(page).described_as("UI 场景缺少 page（请检查 environment.py 钩子）").is_not_none()

    # 记录登录请求（跨步骤共享，场景隔离）
    context.login_requests: List[str] = []
    page.on(
        "request",
        lambda req: context.login_requests.append(req.url)
        if "/api/v1/auth/login" in req.url
        else None,
    )

    url = f"{Config().base_url}{path}"
    logger.info("打开首页：%s", url)
    page.goto(url, wait_until="domcontentloaded")
    logger.info("首页已加载，URL=%s", page.url)


@given('用户名 "{username}" 从未注册')
def step_username_never_registered(context, username):
    """断言该用户名不存在于后端种子数据（用户名不存在用例前置）。"""
    registered = {user.get("username") for user in _load_stored_users()}
    assert_that(registered).described_as(
        f"前置条件失败：'{username}' 已存在于种子数据，场景将失去意义"
    ).does_not_contain(username)
    logger.info("确认用户名 '%s' 从未注册", username)


# ======================================================================
# When：用户操作 / 触发动作
# ======================================================================
@when('用户点击导航栏的"登录 / 注册"按钮，打开标题为"欢迎回来"的登录弹窗')
def step_open_login_modal(context):
    """点击导航栏登录按钮，并等待弹窗标题「欢迎回来」可见。"""
    home = HomePage(context.page)
    home.click_login_register()
    _modal(context.page).wait_until_open(LoginModal.TITLE_LOGIN)


@when('在"用户名"输入框输入 "{username}"')
def step_fill_username(context, username):
    """在弹窗用户名输入框填入文本。"""
    _modal(context.page).fill_username(username)


@when('在"密码"输入框输入 "{password}"')
def step_fill_password(context, password):
    """在弹窗密码输入框填入文本。"""
    _modal(context.page).fill_password(password)


@when('点击"登 录"按钮')
def step_click_login_submit(context):
    """点击弹窗「登 录」提交按钮。"""
    _modal(context.page).click_submit()


@when('"用户名"输入框保持留空')
def step_keep_username_empty(context):
    """用户名输入框保持留空（置空兜底，确保不残留上一步输入）。"""
    _modal(context.page).fill_username("")


@when('"密码"输入框保持留空')
def step_keep_password_empty(context):
    """密码输入框保持留空（置空兜底）。"""
    _modal(context.page).fill_password("")


# ======================================================================
# Then：断言 / 验证
# ======================================================================
@then('登录弹窗关闭，标题"欢迎回来"不再显示')
def step_modal_closed(context):
    """登录成功：弹窗标题隐藏 / 弹窗关闭。"""
    _modal(context.page).wait_until_closed(LoginModal.TITLE_LOGIN)


@then('导航栏不再显示"登录 / 注册"按钮，改为显示用户名"{display_name}"与"退出"按钮')
def step_navbar_logged_in_state(context, display_name):
    """登录成功：导航栏切换为登录态（无登录按钮，显示用户名与退出按钮）。"""
    home = HomePage(context.page)
    assert_that(home.has_login_register_button()).described_as(
        "登录后导航栏仍显示「登录 / 注册」按钮"
    ).is_false()
    home.wait_logout_button()

    navbar_text = home.navbar_text()
    assert_that(navbar_text).described_as("导航栏应显示用户名").contains(display_name)
    assert_that(navbar_text).described_as("导航栏应显示退出按钮").contains("退出")


@then('导航栏改为显示用户名"{display_name}"与"退出"按钮')
def step_navbar_logged_in_state_short(context, display_name):
    """登录成功（大小写变体）：导航栏显示登录态（用户名 + 退出）。"""
    home = HomePage(context.page)
    home.wait_logout_button()

    navbar_text = home.navbar_text()
    assert_that(navbar_text).described_as("导航栏应显示用户名").contains(display_name)
    assert_that(navbar_text).described_as("导航栏应显示退出按钮").contains("退出")


@then('页面导航至个人页 "{path}"，头部展示如下信息：')
def step_navigate_to_profile_with_table(context, path):
    """登录成功：跳转到个人页且 Profile 头部展示声明的身份信息。"""
    context.page.wait_for_url(f"**{path}*", timeout=Config().default_timeout)
    notebook = NotebookPage(context.page, username=path.rstrip("/").rsplit("/", 1)[-1])

    for row in context.table:
        field, expected = row["字段"], row["值"]
        if field == "显示名称":
            notebook.wait_display_name(expected)
        elif field == "用户名":
            notebook.wait_username(expected.lstrip("@"))
        else:
            raise AssertionError(f"不支持的头部字段：{field}")


@then('页面导航至个人页 "{path}"（存储态用户名），头部显示名称"{display_name}"与用户名"@{username}"')
def step_navigate_to_profile_stored_username(context, path, display_name, username):
    """登录成功（大小写变体）：跳转到存储态用户名个人页并断言头部身份。"""
    context.page.wait_for_url(f"**{path}*", timeout=Config().default_timeout)
    notebook = NotebookPage(context.page, username=username)
    notebook.wait_display_name(display_name)
    notebook.wait_username(username)


@then('登录弹窗保持打开，弹窗内显示提示信息"{message}"')
def step_modal_open_with_error(context, message):
    """登录失败/必填校验：弹窗保持打开且显示指定提示。"""
    modal = _modal(context.page)
    modal.wait_until_open(LoginModal.TITLE_LOGIN)
    modal.expect_error(message)


@then('导航栏仍显示"登录 / 注册"按钮，页面停留在首页 "{path}"')
def step_navbar_unauthenticated_on_home(context, path):
    """失败场景：仍为未登录态，URL 未跳转（停留首页）。"""
    home = HomePage(context.page)
    assert_that(home.has_login_register_button()).described_as(
        "导航栏应仍显示「登录 / 注册」按钮"
    ).is_true()
    assert_that(_current_path(context.page)).described_as("URL 不应发生跳转").is_equal_to(path)


@then('提示信息不包含"用户不存在"字样')
def step_error_not_mention_not_found(context):
    """统一错误文案：提示中不得出现「用户不存在」（防用户名枚举）。"""
    error_text = _modal(context.page).get_error_text()
    assert_that(error_text).described_as("弹窗内未读取到错误提示").is_not_empty()
    assert_that(error_text).described_as(
        f"错误提示不应泄露用户名枚举信息，实际：{error_text}"
    ).does_not_contain("用户不存在")


@then('未向后端发出登录请求')
def step_no_login_request_sent(context):
    """必填校验先行：不得向后端发出登录请求。"""
    requests = list(getattr(context, "login_requests", []) or [])
    assert_that(requests).described_as(
        "前端必填校验应拦截请求，实际已向后端发出登录请求"
    ).is_empty()
