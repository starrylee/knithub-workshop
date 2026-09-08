import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// 独立于 vite.config.ts：不加载 Figma 专用插件（site.json 等），仅服务单元/组件测试。
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
