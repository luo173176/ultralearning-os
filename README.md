# Ultralearning OS

> 把《Ultralearning》的九大原则，变成可执行、可追踪、可复盘的学习工作流。

Ultralearning OS 是一个**本地优先**的开源学习项目管理系统。它不是又一个闪卡或待办工具，而是围绕「一个学习项目」的完整方法论脚手架：从开局画地图（元学习），到直接练习、钻练弱点、检索测试、收集反馈，直到项目复盘（维持 / 重学 / 精通）。

## 特性

- 🗺️ **创建向导**：Why / What / How 三问开局，概念·事实·程序分类，10% 研究规则预算，基准资源与专家访谈模板
- 🎯 **九原则仪表盘**：每个原则一组检查清单、由数据推导的状态与建议，哪里薄弱一眼看到
- 🍅 **学习会话**：番茄钟 + 分心记录，量化专注质量
- 🔨 **直接练习与钻练**：项目式 / 沉浸 / 模拟 / Overkill，Direct-Then-Drill 弱点攻坚循环
- 🧠 **检索与保持**：闪卡（SM-2 间隔重复）、自由回忆、问题书、闭卷挑战
- 💬 **反馈与直觉**：结果 / 信息 / 纠正三型反馈与元反馈，费曼笔记与解释深度自检
- 🧪 **实验**：方法 A/B 对比实验卡
- 📤 **数据自有**：一键导出 Markdown / JSON / CSV，本地 SQLite 单文件，随时备份带走

## 快速开始

要求：Node.js 20+ 与 pnpm 12。

```bash
pnpm install
pnpm db:setup   # 应用迁移并写入演示数据
pnpm dev        # 打开 http://localhost:3000
```

> 国内网络提示：若 `prisma generate` 下载引擎慢或失败，可在项目根目录创建 `.env`：
> `PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma/` 和
> `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`（该文件已被 gitignore，不会入库）。

常用命令：

```bash
pnpm lint     # ESLint
pnpm test     # Vitest 单元测试
pnpm build    # 生产构建
```

## 技术栈

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Prisma + SQLite · Zod + React Hook Form · Zustand · Vitest · Playwright

## 数据与隐私

所有数据保存在本地 `prisma/dev.db` 单文件中：没有账号、没有上传、没有遥测。`/settings` 页可随时导出 Markdown / JSON / CSV（导出功能随 v0.1.0 提供）。

## 项目状态与路线图

当前处于 **v0.1.0（MVP）开发中**，按阶段推进：

| 阶段 | 内容 | 状态 |
|---|---|---|
| 0 | 地基：脚手架、CI、规范 | ✅ |
| 1 | 元学习：数据模型、项目 CRUD、创建向导、学习地图 | ✅ |
| 2 | 专注：学习会话与番茄钟 | ✅ |
| 3 | 提取：闪卡与 SM-2、检索练习 | ✅ |
| 4 | 直接性与钻练 | ✅ |
| 5 | 九原则仪表盘与导出 | 🚧 |

完整设计见 [docs/PLAN.md](docs/PLAN.md)，阶段计划见 [docs/ROADMAP.md](docs/ROADMAP.md)。

## 说明与致谢

本项目受 Scott H. Young《Ultralearning》启发，仅引用其原则名称与概念，并以我们自己的语言重新描述，不包含原书文本。想真正掌握方法论，请阅读原书。

## License

[MIT](LICENSE)
