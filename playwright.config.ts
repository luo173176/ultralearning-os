import { defineConfig } from "@playwright/test";

// E2E 跑生产构建（pnpm start）：dev 模式的 Fast Refresh 重编译会打断
// in-flight 的 Server Action 响应并触发自动重试，导致假失败。
//
// reuseExistingServer 始终为 true：
// - 本地：先 pnpm build，再 pnpm test:e2e（无服务时自动拉起）
// - CI：由 workflow 显式启动服务器并做就绪探测后复用，
//   避免 Playwright 清理 webServer 进程树时被残留的 next-server 卡死
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
  },
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
