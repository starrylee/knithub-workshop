import { expect, test, type Page } from "@playwright/test";

/**
 * 登录态 E2E（真实浏览器 + 真实后端，演示账号 woolenwhimsy / knit123）。
 *
 * 覆盖：未登录入口与守卫（AC-3/决策 6）、登录失败统一提示（AC-2）、
 * 登录成功（US-02）、刷新保持登录态（US-03）、登出销毁会话（US-04）、
 * 未捕获 JS 异常守卫（笔记本页不白屏）。
 */

/** 导航栏容器——登录态断言只认这里（页面正文里的同名文字不算登录态）。 */
const nav = (page: Page) => page.locator("header");

/** 收集页面未捕获异常（渲染守卫：任何 pageerror 都视为白屏/崩溃信号）。 */
function watchPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

/** 经登录弹窗完成登录，并等待导航栏出现用户名。 */
async function loginViaModal(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "登录 / 注册", exact: true }).click();
  await page.getByPlaceholder("如 woolenwhimsy").fill("woolenwhimsy");
  await page.locator('input[type="password"]').fill("knit123");
  await page.getByRole("button", { name: "登 录", exact: true }).click();
  await expect(page.getByRole("button", { name: "退出", exact: true })).toBeVisible({ timeout: 10_000 });
}

test("未登录时展示登录入口，点「我的项目」弹出登录框", async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "登录 / 注册", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "退出", exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: "我的项目" }).click();
  await expect(page.getByText("欢迎回来")).toBeVisible();
  expect(errors).toEqual([]);
});

test("密码错误时展示统一提示，不透露用户名是否存在", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "登录 / 注册", exact: true }).click();
  await page.getByPlaceholder("如 woolenwhimsy").fill("woolenwhimsy");
  await page.locator('input[type="password"]').fill("wrong-password");
  await page.getByRole("button", { name: "登 录", exact: true }).click();

  await expect(page.getByText("用户名或密码错误")).toBeVisible();
  await expect(page.getByRole("button", { name: "退出", exact: true })).toHaveCount(0);
});

test("登录成功跳转到个人笔记本并显示当前用户", async ({ page }) => {
  const errors = watchPageErrors(page);
  await loginViaModal(page);

  await expect(page).toHaveURL(/\/users\/woolenwhimsy/);
  await expect(nav(page).getByText("Sarah Chen")).toBeVisible();
  expect(errors).toEqual([]);
});

test("刷新页面后登录态保持（US-03 会话恢复）", async ({ page }) => {
  const errors = watchPageErrors(page);
  await loginViaModal(page);

  await page.reload();
  await expect(nav(page).getByText("Sarah Chen")).toBeVisible();
  await expect(page.getByRole("button", { name: "登录 / 注册", exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("登出后回到未登录，且刷新不会恢复（US-04 会话销毁）", async ({ page }) => {
  const errors = watchPageErrors(page);
  await loginViaModal(page);
  await page.getByRole("button", { name: "退出", exact: true }).click();

  await expect(page.getByRole("button", { name: "登录 / 注册", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "登录 / 注册", exact: true })).toBeVisible();
  await expect(nav(page).getByText("Sarah Chen")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("他人笔记本页正常渲染（mock 数据缺失时不白屏）", async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.goto("/users/threadcountess");

  await expect(page.getByRole("button", { name: "登录 / 注册", exact: true })).toBeVisible();
  const text = await page.locator("body").innerText();
  expect(text.trim().length).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});
