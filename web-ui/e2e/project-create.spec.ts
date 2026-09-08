import { expect, test } from "@playwright/test";

/**
 * FT-02-US-01 创建编织项目 · 前端 E2E（真实浏览器 + 真实后端）。
 *
 * 覆盖：AC-1 创建成功置顶 + toast「项目已创建」+ 状态「待开始」；
 * AC-2 里程碑随表单提交；AC-3 空名称前端拦截（不发请求）；AC-5 游客看不到「新建项目」。
 *
 * 前提：Vite dev（:5174）与后端（:8080，/api 代理）已启动。
 */

const DEMO = { username: "woolenwhimsy", password: "knit123" };

async function loginAsDemo(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "登录 / 注册", exact: true }).click();
  await page.getByPlaceholder("如 woolenwhimsy").fill(DEMO.username);
  await page.locator('input[type="password"]').fill(DEMO.password);
  await page.getByRole("button", { name: "登 录", exact: true }).click();
  await expect(page.getByRole("button", { name: "退出", exact: true })).toBeVisible({ timeout: 10_000 });
}

test("已登录用户可创建项目，新项目置顶并显示 toast", async ({ page }) => {
  await loginAsDemo(page);
  await page.goto("/users/woolenwhimsy");

  await page.getByRole("button", { name: "+ 新建项目" }).click();
  await page.getByPlaceholder("如 祖母的生日披肩").fill("祖母的生日披肩");
  await page.locator('input[type="date"]').first().fill("2026-10-31");
  await page.getByRole("button", { name: "创建项目" }).click();

  await expect(page.getByText("项目已创建")).toBeVisible();
  const firstCard = page.locator("section h2:has-text('我的项目') ~ div .rounded-xl").first();
  await expect(firstCard.getByText("祖母的生日披肩")).toBeVisible();
  await expect(firstCard.getByText("待开始")).toBeVisible();
});

test("携带里程碑创建后随项目展示", async ({ page }) => {
  await loginAsDemo(page);
  await page.goto("/users/woolenwhimsy");

  await page.getByRole("button", { name: "+ 新建项目" }).click();
  await page.getByPlaceholder("如 祖母的生日披肩").fill("圣诞袜");
  await page.locator('input[type="date"]').first().fill("2026-12-24");
  await page.getByRole("button", { name: "+ 添加里程碑" }).click();
  await page.getByPlaceholder("里程碑名称").fill("织袜筒");
  await page.getByRole("button", { name: "创建项目" }).click();

  const firstCard = page.locator("section h2:has-text('我的项目') ~ div .rounded-xl").first();
  await expect(firstCard.getByText("圣诞袜")).toBeVisible();
  await expect(firstCard.getByText("织袜筒")).toBeVisible();
});

test("项目名称为空时前端拦截并提示，不创建", async ({ page }) => {
  await loginAsDemo(page);
  await page.goto("/users/woolenwhimsy");

  await page.getByRole("button", { name: "+ 新建项目" }).click();
  await page.locator('input[type="date"]').first().fill("2026-11-15");
  await page.getByRole("button", { name: "创建项目" }).click();

  await expect(page.getByText("请填写项目名称")).toBeVisible();
  await expect(page.getByText("项目已创建")).toHaveCount(0);
});

test("游客看不到「新建项目」入口", async ({ page }) => {
  await page.goto("/users/woolenwhimsy");
  await expect(page.getByRole("button", { name: "+ 新建项目" })).toHaveCount(0);
});
