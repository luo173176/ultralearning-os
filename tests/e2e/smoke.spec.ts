import { expect, test } from "@playwright/test";

// MVP 主链路冒烟：创建项目 → 建卡 → 复习 → 仪表盘 → 导出
test("创建项目、建卡复习、看仪表盘并导出", async ({ page }) => {
  const name = `冒烟项目 ${Date.now()}`;

  // 1. 创建向导四步
  await page.goto("/");
  await page.getByRole("link", { name: "新建项目" }).click();
  await page.getByLabel("项目名称").fill(name);
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "创建项目" }).click();

  await page.waitForURL((url) => {
    const m = url.pathname.match(/^\/projects\/([a-z0-9]+)$/);
    return m !== null && m[1] !== "new";
  });
  const base = new URL(page.url()).pathname;
  const projectId = base.split("/")[2];

  await expect(page.getByText("九原则检查清单")).toBeVisible();

  // 2. 建一张闪卡
  await page.goto(`${base}/retrieval`);
  await page.getByRole("tab", { name: "闪卡管理" }).click();
  await page.getByRole("button", { name: "添加卡片" }).click();
  await page.getByLabel("正面（问题）").fill("冒烟问题：Ultralearning 的作者是谁？");
  await page.getByLabel("背面（答案）").fill("Scott H. Young");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("冒烟问题：Ultralearning 的作者是谁？")).toBeVisible();

  // 3. 今日复习：翻面 → 评分
  await page.getByRole("tab", { name: /今日复习/ }).click();
  await expect(page.getByText("第 1 / 1 张")).toBeVisible();
  await page.getByRole("button", { name: "翻面" }).click();
  await page.getByRole("button", { name: "想起来了" }).click();
  await expect(page.getByText("全部复习完")).toBeVisible();

  // 4. 仪表盘：九原则卡片渲染
  await page.goto(base);
  await expect(page.getByText("九原则检查清单")).toBeVisible();
  await expect(page.getByText("研究预算").first()).toBeVisible();

  // 5. 导出 Markdown 报告
  const res = await page.request.get(`/api/export?projectId=${projectId}&format=md`);
  expect(res.status()).toBe(200);
  const md = await res.text();
  expect(md).toContain(name);
  expect(md).toContain("九原则检查清单");
  expect(md).toContain("冒烟问题：Ultralearning 的作者是谁？");

  // 6. 导出 JSON
  const resJson = await page.request.get(`/api/export?projectId=${projectId}&format=json`);
  expect(resJson.status()).toBe(200);
  const json = (await resJson.json()) as { name: string; cards: unknown[] };
  expect(json.name).toBe(name);
  expect(json.cards).toHaveLength(1);
});
