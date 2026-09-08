"""操作触发登录（FT-01-US-05，需求变更口径 A）的 UI Step Definitions。

覆盖 ``features/ui/action-triggered-login.feature`` 场景：访客在首页点击受限
导航入口（图案库 / 我的项目 / 社区 / 关于）→ 弹出登录弹窗（AC-1）；登录成功
后自动续接进入该入口目标页（AC-2）；已登录用户再点受限入口直达、无登录墙
（AC-3，原「公开页免登录浏览」口径已随需求变更撤销）。

实现说明：
- 前置步骤（未登录浏览首页）与弹窗填表/提交/错误断言步骤复用
  ``user_login_ui_steps.py`` / ``pages.login_modal.LoginModal`` 既有能力；
- 受限入口触发点为 Navbar 导航项（口径 A：图案库/我的项目/社区/关于，
  见页面对象 ``HomePage.click_nav_entry``）；
- 「未发生页面拦截跳转」以 URL 路径在短暂等待后仍保持不变断言。
"""

from __future__ import annotations

from urllib.parse import urlparse

from assertpy import assert_that
from behave import then, when

from core.config import Config
from core.logger import get_logger
from pages.home_page import HomePage
from pages.login_modal import LoginModal

logger = get_logger(__name__)


def _modal(page) -> LoginModal:
    """构造当前页面对应的登录弹窗对象。"""
    return LoginModal(page)


def _current_path(page) -> str:
    """取当前页面 URL 的 path 部分。"""
    return urlparse(page.url).path


# ======================================================================
# When：触发受限入口 / 续接
# ======================================================================
@when('用户点击导航栏的"{entry}"')
def step_click_nav_entry(context, entry: str):
    """访客点击导航栏受限入口（图案库 / 我的项目 / 社区 / 关于）。"""
    HomePage(context.page).click_nav_entry(entry)
    logger.info("已点击导航栏「%s」", entry)


# ======================================================================
# Then：断言
# ======================================================================
@then('弹出标题为"欢迎回来"的登录弹窗')
def step_login_modal_shown(context):
    """受限入口触发：弹出登录弹窗（登录态标题「欢迎回来」）。"""
    _modal(context.page).wait_until_open(LoginModal.TITLE_LOGIN)


@then('页面仍停留在首页 "{path}"，未发生页面拦截跳转')
def step_no_redirect_away_from_home(context, path: str):
    """受限入口触发后：停留首页、未发生跳转（不做页面拦截），登录弹窗仍打开。"""
    # 留出微短等待窗口，若发生跳转/拦截则 URL 会变化
    context.page.wait_for_timeout(500)
    actual = _current_path(context.page)
    assert_that(actual).described_as(
        f"点击受限入口后不应发生页面拦截跳转，实际已跳转到：{actual}"
    ).is_equal_to(path)
    # 二次确认弹窗仍在（未被导航关掉）
    _modal(context.page).wait_until_open(LoginModal.TITLE_LOGIN)
    logger.info("受限入口触发：停留首页 %s，登录弹窗保持打开", path)


@then('页面自动续接进入 "{path}"')
def step_auto_continue_to_target(context, path: str):
    """登录续接：弹窗登录成功后自动进入受限入口目标页，无需再次触发。"""
    context.page.wait_for_url(f"**{path}*", timeout=Config().default_timeout)
    logger.info("已自动续接进入目标页：%s", context.page.url)


@then('无登录弹窗出现')
def step_no_login_modal_shown(context):
    """已登录用户直达受限入口：不应出现登录弹窗。"""
    context.page.wait_for_timeout(400)
    assert_that(_modal(context.page).is_open(LoginModal.TITLE_LOGIN, timeout=1000)).described_as(
        "已登录用户点击受限入口不应弹出登录弹窗"
    ).is_false()
