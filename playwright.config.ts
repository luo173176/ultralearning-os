import { defineConfig } from "@playwright/test";

// E2E 跑生产构建（pnpm start）：dev 模式的 Fast Refresh 重编译会打断
// in-flight 的 Server Action 响应并触发自动重试，导致假失败。
// 本地先 pnpm build 再 pnpm test:e2e；CI 的 e2e job 同样先 build。
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
  },
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
