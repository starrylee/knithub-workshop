import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// 每个用例结束后卸载组件树，避免跨用例 DOM 残留（vitest 未开 globals，RTL 无法自动注册）。
afterEach(() => {
  cleanup();
});
