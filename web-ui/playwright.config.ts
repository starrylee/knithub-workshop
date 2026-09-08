import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 配置（前端冒烟 + FT-01 登录态验收）。
 *
 * 前提：Vite dev（http://localhost:5174）与后端（8080，经 /api 代理）已启动；
 * 这里不托管 webServer，直接复用现有服务，避免重复拉起。
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5174",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
