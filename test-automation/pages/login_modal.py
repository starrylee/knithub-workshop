"""登录弹窗（LoginModal 组件）页面对象。

选择器全部溯源自被测前端源码：
- web-ui/src/components/LoginModal.tsx（弹窗由 Navbar 的"登录 / 注册"
  按钮触发挂载，无独立路由——url_path 沿用宿主首页路径，仅作基类契约）
"""

from __future__ import annotations

from assertpy import assert_that

from pages.base_page import BasePage


class LoginModalPage(BasePage):
    """登录弹窗 POM：凭据填写、提交、开合状态与错误提示断言。"""

    # 弹窗全屏遮罩容器（className="fixed inset-0 z-50 ..."，弹窗卸载即从 DOM 消失）
    # 来源: web-ui/src/components/LoginModal.tsx L44-48
    MODAL_OVERLAY = "div.fixed.inset-0"

    # 弹窗标题 h2（登录模式渲染"欢迎回来"）
    # 来源: web-ui/src/components/LoginModal.tsx L64-66
    MODAL_TITLE = "div.fixed.inset-0 h2"

    # "用户名"输入框（label"用户名"为兄弟节点、未以 for 关联，input 无
    # id / data-testid，按表单内唯一 input[type="text"] 定位）
    # 来源: web-ui/src/components/LoginModal.tsx L73-89
    USERNAME_INPUT = 'div.fixed.inset-0 form input[type="text"]'

    # "密码"输入框（同上，表单内唯一 input[type="password"]）
    # 来源: web-ui/src/components/LoginModal.tsx L90-106
    PASSWORD_INPUT = 'div.fixed.inset-0 form input[type="password"]'

    # 错误提示 <p>（error 非空时条件渲染，表单内唯一 p 元素）
    # 来源: web-ui/src/components/LoginModal.tsx L108-112
    ERROR_MESSAGE = "div.fixed.inset-0 form p"

    # "登 录"提交按钮（type="submit"；表单外的"免费注册"切换按钮不匹配此选择器）
    # 来源: web-ui/src/components/LoginModal.tsx L114-120
    SUBMIT_BUTTON = 'div.fixed.inset-0 form button[type="submit"]'

    @property
    def url_path(self) -> str:
        """弹窗无独立路由，返回宿主页面（首页）路径。"""
        return "/"

    # ------------------------------------------------------------------
    # Action（When 步骤）
    # ------------------------------------------------------------------
    def fill_username(self, username: str) -> "LoginModalPage":
        """在"用户名"输入框填入用户名。"""
        return self.fill(self.USERNAME_INPUT, username)

    def fill_password(self, password: str) -> "LoginModalPage":
        """在"密码"输入框填入密码。"""
        return self.fill(self.PASSWORD_INPUT, password)

    def keep_username_empty(self) -> "LoginModalPage":
        """保持"用户名"输入框留空（不输入，并校验当前值为空）。"""
        assert_that(self.get_input_value(self.USERNAME_INPUT)).described_as(
            '"用户名"输入框应保持留空'
        ).is_empty()
        return self

    def keep_password_empty(self) -> "LoginModalPage":
        """保持"密码"输入框留空（不输入，并校验当前值为空）。"""
        assert_that(self.get_input_value(self.PASSWORD_INPUT)).described_as(
            '"密码"输入框应保持留空'
        ).is_empty()
        return self

    def click_submit(self) -> "LoginModalPage":
        """点击"登 录"提交按钮。"""
        return self.click(self.SUBMIT_BUTTON)

    # ------------------------------------------------------------------
    # 断言（Then 步骤）
    # ------------------------------------------------------------------
    def assert_open_with_title(self, title: str) -> "LoginModalPage":
        """断言弹窗已打开且标题文本正确（如"欢迎回来"）。"""
        self.assert_element_visible(self.MODAL_OVERLAY)
        return self.assert_element_text(self.MODAL_TITLE, title)

    def assert_closed(self) -> "LoginModalPage":
        """断言弹窗已关闭（遮罩卸载、标题不再显示）。"""
        self.wait_for_hidden(self.MODAL_OVERLAY)
        return self.assert_element_not_visible(self.MODAL_TITLE)

    def assert_still_open(self) -> "LoginModalPage":
        """断言弹窗保持打开（遮罩仍可见）。"""
        return self.assert_element_visible(self.MODAL_OVERLAY)

    def get_error_message(self) -> str:
        """获取弹窗内错误提示文本。"""
        return self.get_text(self.ERROR_MESSAGE)

    def assert_error_message(self, message: str) -> "LoginModalPage":
        """断言弹窗内错误提示文本完全等于 message。"""
        return self.assert_element_text(self.ERROR_MESSAGE, message)

    def assert_error_message_not_contains(self, fragment: str) -> "LoginModalPage":
        """断言错误提示不包含 fragment 字样（防用户名枚举文案检查）。"""
        assert_that(self.get_error_message()).described_as(
            f"错误提示不应包含 '{fragment}'，实际提示：{self.get_error_message()}"
        ).does_not_contain(fragment)
        return self
