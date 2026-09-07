"""Behave 环境钩子。

职责：
- 套件级：初始化配置单例、准备截图目录
- Feature 级：按需启动/关闭浏览器（仅 UI feature）
- Scenario 级：重置 API 客户端状态、创建隔离的 Page、失败截图与测试数据清理

被测系统：织友 Web 站点（前端 BASE_URL，后端 API_BASE_URL）。
"""

from __future__ import annotations

import re
from typing import List, Optional

from core.api_client import APIClient
from core.browser_factory import BrowserFactory
from core.config import Config
from core.logger import get_logger

logger = get_logger(__name__)

# 判定为 UI 测试的 tag
UI_TAGS = {"ui", "browser", "e2e"}


# ======================================================================
# 套件级钩子
# ======================================================================
def before_all(context) -> None:
    """初始化全局配置与输出目录。"""
    context.config_obj = Config()
    context.config_obj.screenshot_dir  # 触发目录创建

    logger.info("=" * 70)
    logger.info("测试套件启动")
    logger.info("BASE_URL     : %s", context.config_obj.base_url)
    logger.info("API_BASE_URL : %s", context.config_obj.api_base_url)
    logger.info("BROWSER      : %s (headless=%s)", context.config_obj.browser, context.config_obj.headless)
    logger.info("=" * 70)


def after_all(context) -> None:
    """记录套件结束日志。"""
    logger.info("=" * 70)
    logger.info("测试套件执行完成")
    logger.info("=" * 70)


# ======================================================================
# Feature 级钩子
# ======================================================================
def before_feature(context, feature) -> None:
    """UI feature 启动浏览器；初始化 feature 级结果统计。"""
    context.ui_feature = _is_ui_feature(feature)
    context.browser_factory = None

    logger.info("开始执行 Feature：%s（tags=%s，UI=%s）", feature.name, list(feature.tags), context.ui_feature)

    if context.ui_feature:
        context.browser_factory = BrowserFactory()
        context.browser_factory.initialize()


def after_feature(context, feature) -> None:
    """关闭浏览器（仅 UI feature）。"""
    if getattr(context, "browser_factory", None) is not None:
        context.browser_factory.close()
        BrowserFactory.reset()
        context.browser_factory = None

    logger.info("Feature 执行结束：%s", feature.name)


# ======================================================================
# Scenario 级钩子
# ======================================================================
def before_scenario(context, scenario) -> None:
    """重置 API 状态与清理列表；UI 场景创建独立 Page。"""
    # --- API 侧：保证场景之间不共享 Token / Cookie ---
    APIClient.reset()
    context.api_client = APIClient()
    context.response = None
    context.validator = None

    # --- 测试数据清理列表 ---
    # Step Definitions 创建资源后，应把资源 ID 追加到对应列表，由 after_scenario 统一清理。
    context.users_to_cleanup: List = []
    context.projects_to_cleanup: List = []

    # --- UI 侧：每个场景一个全新的 context + page ---
    if getattr(context, "ui_feature", False) and getattr(context, "browser_factory", None):
        context.page = context.browser_factory.new_page()
    else:
        context.page = None

    logger.info("开始执行 Scenario：%s（tags=%s）", scenario.name, list(scenario.tags))


def after_scenario(context, scenario) -> None:
    """失败截图、清理测试数据、关闭浏览器上下文。"""
    try:
        if scenario.status == "failed":
            _log_failure_details(context, scenario)
            _capture_failure_screenshot(context, scenario)
    finally:
        try:
            _cleanup_test_data(context)
        finally:
            if getattr(context, "browser_factory", None) is not None:
                context.browser_factory.close_context()

    logger.info("Scenario 执行结束：%s（status=%s）", scenario.name, scenario.status)


# ======================================================================
# 辅助函数
# ======================================================================
def _is_ui_feature(feature) -> bool:
    """判断 feature 是否为 UI 测试。

    判定规则（满足其一即为 UI）：
    1. feature 带 ``@ui`` / ``@browser`` / ``@e2e`` tag；
    2. feature 文件路径包含 ``/ui/``。
    """
    tags = {str(tag).lower() for tag in getattr(feature, "tags", [])}
    if tags & UI_TAGS:
        return True

    filename = str(getattr(feature, "filename", "") or "").replace("\\", "/")
    return "/ui/" in filename


def _capture_failure_screenshot(context, scenario) -> Optional[str]:
    """场景失败时截图（仅 UI 场景且开启截图开关）。"""
    browser_factory = getattr(context, "browser_factory", None)
    if browser_factory is None or getattr(context, "page", None) is None:
        return None

    if not context.config_obj.screenshot_on_failure:
        return None

    name = re.sub(r"[^\w\-]+", "_", f"FAILED_{scenario.name}")[:80]
    path = browser_factory.take_screenshot(name)
    return str(path) if path else None


def _log_failure_details(context, scenario) -> None:
    """记录失败详情，便于定位。"""
    logger.error("场景失败：%s", scenario.name)

    if getattr(context, "response", None) is not None:
        response = context.response
        logger.error("  最后一次 API 响应：status=%s", response.status_code)
        logger.error("  响应体：%s", (response.text or "")[:1000])

    page = getattr(context, "page", None)
    if page is not None:
        try:
            logger.error("  当前 URL：%s", page.url)
        except Exception:  # pragma: no cover - 页面已崩溃时忽略
            logger.error("  当前 URL：不可用（页面已关闭）")

    step = getattr(scenario, "failed_step", None) if hasattr(scenario, "failed_step") else None
    if step is not None:
        logger.error("  失败步骤：%s %s", step.step_type, step.name)
        if getattr(step, "error_message", None):
            logger.error("  错误信息：%s", step.error_message[:2000])


def _cleanup_test_data(context) -> None:
    """清理场景创建的测试数据。

    遍历 ``context.<resource>_to_cleanup`` 列表，调用对应 Service 的删除方法。
    清理失败只记录警告，不阻断后续场景。
    """
    cleanup_plan = (
        ("projects_to_cleanup", "services.project_service", "ProjectService", "delete"),
        ("users_to_cleanup", "services.user_service", "UserService", "delete"),
    )

    for attr, module_path, class_name, method_name in cleanup_plan:
        resource_ids = list(getattr(context, attr, []) or [])
        if not resource_ids:
            continue

        for resource_id in reversed(resource_ids):
            try:
                module = __import__(module_path, fromlist=[class_name])
                service = getattr(module, class_name)()
                getattr(service, method_name)(resource_id)
                logger.info("已清理测试数据：%s=%s", attr, resource_id)
            except ImportError:
                logger.warning("跳过清理：%s 尚未实现（%s）", attr, module_path)
                break
            except Exception as exc:
                logger.warning("清理测试数据失败：%s=%s，原因：%s", attr, resource_id, exc)

        setattr(context, attr, [])
