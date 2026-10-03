# 架构说明

Ultralearning OS 的技术架构与关键决策。产品方案见 [PLAN.md](PLAN.md)，阶段计划见 [ROADMAP.md](ROADMAP.md)。

## 总体架构

本地优先的单用户 Web 应用：Next.js 15 App Router + SQLite 单文件。无账号、无上传、无遥测。

```
┌─ app/                      页面（Server Components 直读数据库）
│   ├─ page.tsx              项目列表
│   ├─ projects/new          创建向导（客户端 RHF 表单）
│   ├─ projects/[id]/*       工作台：仪表盘/地图/会话/检索/练习/钻练
│   └─ api/export            导出 Route Handler（唯一的 REST 端点）
├─ server/actions/           "use server"：全部写操作（Zod 校验 + revalidatePath）
├─ lib/
│   ├─ sm2.ts                SM-2 间隔重复（纯函数，算法与 UI 隔离）
│   ├─ dashboard.ts          九原则状态推导（纯函数）
│   ├─ focus.ts              计时/周统计（纯函数）
│   ├─ export/markdown.ts    Markdown 报告生成（纯函数）
│   ├─ domain.ts             枚举 + 中文标签 + 领域规则
│   └─ validators/           每域 Zod schema（客户端表单与服务端校验共用）
├─ components/               UI（shadcn/ui + 领域组件）
│   └─ focus/timer-store.ts  唯一的客户端全局状态（Zustand + persist）
└─ prisma/                   schema + 迁移 + seed
```

**数据流**：Server Components 直接 `db.*` 读 → 客户端事件调 Server Action → Action 用 Zod 校验、写库、`revalidatePath` → 路由段刷新。没有 API 层（导出除外），没有客户端数据缓存层。

## 关键决策

| 决策 | 理由 |
|---|---|
| Prisma + SQLite，schema 用字面量 `url = "file:./dev.db"` | 零配置本地启动；切 Postgres 只改 provider/url 两行 |
| 枚举存 String + Zod 校验 | Prisma 的 SQLite provider 不支持原生 enum/Json |
| Server Actions 而非 REST | 本地单用户无第三方消费方；导出文件承担对外可编程性 |
| DB 页面一律 `export const dynamic = "force-dynamic"` | CI 构建时无需数据库 |
| SM-2 纯函数 + 接口隔离 | 算法可单测、可解释，未来整体换 FSRS 不动 UI |
| Zustand 只管番茄钟运行态（persist 到 localStorage） | 其余数据一律以数据库为唯一事实来源 |
| 轻量 i18n（`messages/zh-CN.ts` + `t()`） | 文案集中；v0.3 加 en 包即可，不引 next-intl |
| E2E 跑生产构建（`pnpm start`） | dev 模式的 Fast Refresh 重编译会打断 in-flight Server Action 并触发自动重试，产生假失败 |

## 数据模型（17 张表）

- **项目域**：`Project`（Why/What/How、状态、计划时长、研究预算）+ `ChecklistItem`（九原则检查清单，向导时按模板生成）
- **元学习**：`TopicItem`（概念/事实/程序 + 掌握度 0-3）、`Resource`（含基准标记）、`InterviewNote`
- **专注**：`Session`（可挂接 DirectPractice）、`Interruption`
- **提取/保持**：`Card`（SM-2 调度状态）+ `ReviewLog`、`RetrievalExercise`（自由回忆/问题书/闭卷挑战）
- **直接性/钻练**：`DirectPractice`（四形态）、`WeakPoint`（来源四类）、`DrillTask`（五种切片、待验证状态机）
- **预留（v0.2/v0.3）**：`FeedbackEntry`、`FeynmanNote`、`Experiment`、`ProjectReview`

全部子表对 `Project` 级联删除；`Session.practiceId`、`WeakPoint.practiceId`、`Card.topicItemId` 为可选关系（SetNull）。

## Direct-Then-Drill 状态机

```
直接练习(IN_PROGRESS) --发现弱点--> WeakPoint(OPEN)
WeakPoint --创建钻练--> DrillTask(TODO) → WeakPoint(DRILLING)
DrillTask: TODO → DOING → AWAIT_VERIFY →(verifyDrill)→ DONE
verifyDrill 时若弱点下无未完成任务 → WeakPoint(RESOLVED)   ← 闭环收口
```

## 测试策略

- **单元（Vitest）**：纯函数层——SM-2 调度、仪表盘推导、计时/统计、领域校验、原则元数据（40 例）
- **E2E（Playwright，chromium）**：主链路冒烟——创建向导 → 建卡 → 复习 → 仪表盘 → 导出 MD/JSON
- **CI**：`verify` job（lint + 单测 + build + 显式 prisma generate）与 `e2e` job（build + migrate deploy + playwright）

## 已知限制

- 未结束的会话（浏览器关闭且 localStorage 丢失）会在历史中留"未结束"记录，阶段 6+ 统一处理
- 新卡建立即进入今日队列，没有"每日新卡上限"
- 导出 CSV、反馈/直觉/实验模块、复盘见 ROADMAP 的 v0.2/v0.3
