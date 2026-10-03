# ultralearning-os 项目方案 v1.0（待确认）

> 状态：**方案阶段，未写任何代码**。确认后按阶段逐模块实现，每阶段结束汇报等确认。
> 计划路径：`E:\Users\luo17\AppData\Programs\Zcode\ultralearning-os`（与以往项目同级），GitHub 仓库名 `ultralearning-os`。

---

## 1. 项目定位

**一句话定位**：把《Ultralearning》九大原则变成可执行、可追踪、可复盘工作流的**本地优先**学习项目管理系统。

**名字**：ultralearning-os。"OS" 的含义：围绕"一个学习项目"的全生命周期操作系统，而不是某个单点工具。备选名：ultralearn-studio、超学台。

**目标用户**：
- 备考族（考公、考研、语言考试）——需要钻练、检索、反馈闭环
- 技能转型者（编程、设计、写作）——需要直接性练习与实验
- 长期自学者——需要项目制管理与长期保持机制

**核心痛点 → 对策**：
| 痛点 | 对策模块 |
|---|---|
| 开局模糊：不知道学什么、按什么顺序、要多少资源 | 元学习向导 + 学习地图 |
| 学而不练：只输入不输出，"看懂了"的错觉 | 直接练习 + 钻练 |
| 假性掌握：合上书就讲不出来 | 检索（闪卡/自由回忆/问题书/闭卷挑战） |
| 闭门造车：没有反馈，错误方法重复一百遍 | 反馈记录（三型 + 元反馈） |
| 学完即忘：往漏桶里灌水 | 间隔重复调度 + 保持策略清单 |
| 项目结束即失忆：没有"然后呢" | 复盘（维持/重学/精通） |
| 工具散落：番茄钟、Anki、笔记各自为政 | 一个项目制的九原则工作台 |

**差异化**：不做通用闪卡（有 Anki）、不做通用待办（有 Todoist）。独有价值是**项目级方法论脚手架**——每个功能必须挂在一个原则下，九原则仪表盘逼你直面被跳过的原则。

---

## 2. 九原则 → 功能映射表

（覆盖你列的全部 12 项功能设想）

| 原则 | 功能模块 | 核心实体 | 交付阶段 |
|---|---|---|---|
| 1 元学习 | ①创建向导（Why/What/How、概念/事实/程序分类、10% 研究规则预算、专家访谈模板、基准资源）+ 学习地图页 | Project、TopicItem、Resource、InterviewNote | 阶段 1 |
| 2 专注 | ③学习会话：番茄钟、结束自评专注度、分心一键记录 | Session、Interruption | 阶段 2 |
| 3 直接性 | ④直接练习看板：项目式 / 沉浸 / 模拟 / Overkill 四种形态 | DirectPractice | 阶段 4 |
| 4 钻练 | ⑤弱点识别（可从练习/反馈/检索错误转入）、Direct-Then-Drill 循环提示、钻练切片类型（时间切片/认知切片/复制模仿/放大镜/前提隔离） | WeakPoint、DrillTask | 阶段 4 |
| 5 提取 | ⑥闪卡（间隔重复复习队列）、自由回忆（默写+对照自评覆盖率）、问题书、闭卷挑战 | Card、ReviewLog、RetrievalExercise | 阶段 3 |
| 6 反馈 | ⑦结果/信息/纠正三型反馈、来源（自评/导师/同伴/工具）、元反馈（对学习方法本身的反馈） | FeedbackEntry | 阶段 6（v0.2） |
| 7 保持 | ⑧间隔重复调度（复用闪卡引擎）+ 保持策略清单（程序化/过度学习/助记勾选项） | ReviewLog + ChecklistItem | 阶段 3 + 6 |
| 8 直觉 | ⑨费曼笔记（大白话解释）、解释深度自检（1-5）、卡壳点记录 | FeynmanNote | 阶段 6（v0.2） |
| 9 实验 | ⑩方法 A/B 对比卡、新约束实验、风格/极端实验 | Experiment | 阶段 7（v0.3） |
| 贯穿 | ②九原则仪表盘：每原则检查清单 + 数据推导状态 + 一条建议 | ChecklistItem + `lib/principles.ts` | 阶段 5 |
| 收尾 | ⑪项目复盘：维持 / 重学 / 精通 + 后续动作 | ProjectReview | 阶段 6（v0.2） |
| 基建 | ⑫导出 Markdown / JSON / CSV；i18n 结构预留 | — | 阶段 5/6/7 |

**设计要点——Direct-Then-Drill 闭环**：直接练习详情页一键"发现弱点"→ 弱点页创建钻练任务 → 钻练完成后状态变为"待验证"并提示回到直接练习检验效果。整个循环有数据记录，仪表盘可见。

**设计要点——10% 研究规则**：向导里按计划总时长自动算出"研究预算"（如计划 100 小时 → 画地图/访谈/找基准资源 ≤10 小时），地图页显示预算，MVP 只做展示不自动计时。

---

## 3. MVP 范围

**MVP（v0.1.0，阶段 0-5）**：
1. 项目 CRUD + 创建向导（Why/What/How → 主题分类 → 资源 → 确认生成检查清单）
2. 学习地图页（概念/事实/程序、资源、访谈记录）
3. 学习会话 + 番茄钟 + 分心记录
4. 检索：闪卡管理 + SM-2 简化复习 + 自由回忆/问题书/闭卷挑战
5. 直接练习（四种形态）+ 弱点 + 钻练闭环
6. 九原则仪表盘（清单 + 状态 + 建议）
7. 导出 JSON / Markdown
8. 质量设施：CI、单测（SM-2、仪表盘推导、导出）、Playwright 冒烟、README/架构文档

**明确不做进 MVP**（防蔓延）：反馈模块、费曼笔记、复盘、CSV 导出、统计图表、实验模块、英文语言包、Postgres、数据导入、桌面打包。

**版本节奏**：v0.1.0 = 阶段 0-5；v0.2.0 = 反馈/直觉/复盘/CSV/图表；v0.3.0 = 实验/英文/Postgres 指南。

---

## 4. 用户故事

1. 作为自学者，我通过 15 分钟向导创建"Python 数据分析 60 天"项目，得到学习地图和九原则检查清单，开局不再迷茫。
2. 作为备考者，我每天打开仪表盘，看到"今日 23 张卡到期、1 个弱点待钻练、本周专注 6.5 小时"。
3. 作为学习者，我启动 25 分钟番茄钟，分心时一键记录原因，结束后自评专注度，历史可查。
4. 作为练口语者，我建一个"沉浸"型直接练习（每天 30 分钟只说外语），并可把番茄钟挂到该练习下。
5. 作为学编程者，我在直接练习中发现"异步"总出错，一键转成弱点，建一个"认知切片"钻练任务，练完后回到练习验证。
6. 作为读书人，我读完一章做一次自由回忆，对照原书自评覆盖率 60%，把漏掉的知识点补成闪卡。
7. 作为接受指导者，我把导师指出的错误记为"纠正反馈"，并转成弱点进入钻练。
8. 作为完成项目者，我做一次复盘，选择"维持"，系统生成维持动作清单（低频复习计划）。
9. 作为换机用户，我把项目导出为 JSON 备份，或导出 Markdown 归档到笔记软件。
10. 作为方法探索者，我怀疑"早上学 vs 晚上学"哪个效率高，建一张实验卡，两周后记录结论。

---

## 5. 技术栈说明

按你的默认栈执行，补四个具体决策：

| 层 | 选择 | 说明 |
|---|---|---|
| 框架 | Next.js 15（App Router）+ TypeScript strict | 满足"14+"；同机已有 Next 15 + Tailwind v4 + pnpm 12 跑通先例 |
| UI | Tailwind CSS + shadcn/ui + lucide-react | 中文字体栈加 PingFang/微软雅黑 fallback |
| 数据 | Prisma + SQLite（单文件 `prisma/dev.db`） | 本地优先；schema 可平移 Postgres |
| 表单 | React Hook Form + Zod（zodResolver） | 向导多步表单、各域校验 |
| 状态 | **Zustand（仅番茄钟计时运行态）+ Server Actions + revalidatePath** | 不引 TanStack Query：数据一律落库、服务端渲染，需要轮询/乐观更新时再引入 |
| i18n | `messages/zh-CN.ts` 字典 + `lib/i18n.ts` 的 `t()` 轻封装 | 文案禁止散落硬编码；v0.3 加 `en` 包即可，不引 next-intl 避免路由中间件复杂度 |
| 测试 | Vitest（纯函数：SM-2、仪表盘推导、导出）+ Playwright（冒烟链路） | |
| 工具链 | pnpm 12（需在 `package.json` 放行 prisma/esbuild 构建脚本）、ESLint + Prettier、dayjs | |

**两个注意点**（来自本机实测经验）：
- Prisma 对 SQLite 不支持 `enum` 和 `Json` 字段 → 枚举一律用 `String` + Zod 联合类型校验，迁 Postgres 时可升级为原生 enum（已写进 schema 注释）。
- GitHub 推送：token 缺 workflow scope，`.github/workflows` 必须走 SSH（`ssh://git@ssh.github.com:443/...`）推送。

---

## 6. 数据模型（Prisma schema 草案）

单用户设计，不建 User 表（字段预留注释）；全部子表级联删除；关键表加索引。

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// 注意：SQLite 不支持 enum/Json，枚举统一 String + Zod 校验。
// 枚举值见各行注释，lib/validators/ 中有对应 Zod schema。

model Project {
  id           String    @id @default(cuid())
  name         String
  why          String? // Why：为什么学（动机）
  what         String? // What：学成什么样（能力清单/预期产出）
  how          String? // How：用什么方法与资源
  category     String    @default("OTHER") // LANGUAGE/CODING/EXAM/SKILL/OTHER
  status       String    @default("ACTIVE") // ACTIVE/PAUSED/COMPLETED/ARCHIVED
  plannedHours Int       @default(0)
  researchBudget Int     @default(0) // 10% 研究规则算出的预算（小时）
  deadline     DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  topicItems   TopicItem[]
  resources    Resource[]
  interviews   InterviewNote[]
  sessions     Session[]
  practices    DirectPractice[]
  weakPoints   WeakPoint[]
  drills       DrillTask[]
  cards        Card[]
  exercises    RetrievalExercise[]
  feedbacks    FeedbackEntry[]
  feynmanNotes FeynmanNote[]
  experiments  Experiment[]
  review       ProjectReview?
  checklist    ChecklistItem[]

  @@index([status])
}

// 概念 / 事实 / 程序 三类主题（元学习地图）
model TopicItem {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name      String
  kind      String // CONCEPT/FACT/PROCEDURE
  mastery   Int      @default(0) // 0未学 1学习中 2可输出 3可教别人
  notes     String?
  sortOrder Int      @default(0)

  cards     Card[]

  @@index([projectId])
}

model Resource {
  id          String  @id @default(cuid())
  projectId   String
  project     Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title       String
  url         String?
  type        String  @default("OTHER") // COURSE/BOOK/VIDEO/MENTOR/COMMUNITY/OTHER
  isBenchmark Boolean @default(false) // 基准资源：用来对照"高手做到什么程度"
  notes       String?

  @@index([projectId])
}

model InterviewNote {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  expert    String
  content   String // 内置模板问题的回答记录
  createdAt DateTime @default(now())

  @@index([projectId])
}

model Session {
  id             String    @id @default(cuid())
  projectId      String
  project        Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  practiceId     String? // 可挂到某个直接练习下
  practice       DirectPractice? @relation(fields: [practiceId], references: [id])
  startedAt      DateTime  @default(now())
  endedAt        DateTime?
  plannedMinutes Int       @default(25)
  actualMinutes  Int?
  focusRating    Int? // 1-5 结束自评
  note           String?

  interruptions  Interruption[]

  @@index([projectId, startedAt])
}

model Interruption {
  id        String   @id @default(cuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  at        DateTime @default(now())
  reason    String
  seconds   Int      @default(0) // 分心耗时
}

// 直接练习：PROJECT/IMMERSION/SIMULATION/OVERKILL
model DirectPractice {
  id          String    @id @default(cuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title       String
  form        String
  description String?
  status      String    @default("PLANNED") // PLANNED/IN_PROGRESS/DONE
  startedAt   DateTime?
  completedAt DateTime?

  sessions  Session[]
  weakPoints WeakPoint[]

  @@index([projectId, status])
}

model WeakPoint {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  practiceId String? // 来源练习（可空）
  practice  DirectPractice? @relation(fields: [practiceId], references: [id])
  title     String
  detail    String?
  source    String   @default("SELF") // SELF/PRACTICE/FEEDBACK/RETRIEVAL
  status    String   @default("OPEN") // OPEN/DRILLING/RESOLVED
  createdAt DateTime @default(now())

  drills    DrillTask[]

  @@index([projectId, status])
}

model DrillTask {
  id          String    @id @default(cuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  weakPointId String
  weakPoint   WeakPoint @relation(fields: [weakPointId], references: [id], onDelete: Cascade)
  title       String
  sliceType   String // TIME_SLICE/COGNITIVE_SLICE/COPYCAT/MAGNIFIER/PREREQUISITE
  status      String    @default("TODO") // TODO/DOING/AWAIT_VERIFY(待回练习验证)/DONE
  result      String? // 回到直接练习后的验证结论
  createdAt   DateTime  @default(now())
  completedAt DateTime?

  @@index([projectId, status])
}

model Card {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  topicItemId String?
  topicItem   TopicItem? @relation(fields: [topicItemId], references: [id])
  front       String
  back        String
  // SM-2 调度状态（lib/sm2.ts 纯函数维护）
  dueAt       DateTime @default(now())
  intervalDays Int     @default(0)
  easeFactor  Float    @default(2.5)
  reps        Int      @default(0)
  lapses      Int      @default(0)
  suspended   Boolean  @default(false)

  logs        ReviewLog[]

  @@index([projectId])
  @@index([dueAt, suspended])
}

model ReviewLog {
  id           String   @id @default(cuid())
  cardId       String
  card         Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  reviewedAt   DateTime @default(now())
  grade        String // AGAIN/HARD/GOOD/EASY
  intervalDays Int
  easeFactor   Float

  @@index([cardId])
}

// 检索练习：FREE_RECALL/QUESTION_BOOK/CLOSED_BOOK
model RetrievalExercise {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  kind      String
  title     String
  prompt    String? // 问题书：问题清单；闭卷：挑战说明
  content   String? // 自由回忆默写内容 / 作答内容
  coverage  Int? // 对照资料后的自评覆盖率 0-100
  createdAt DateTime @default(now())

  @@index([projectId, kind])
}

model FeedbackEntry {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  type        String // OUTCOME/INFO/CORRECTIVE
  source      String   @default("SELF") // SELF/MENTOR/PEER/TOOL
  content     String
  actionTaken String? // 针对这条反馈做了什么（可转弱点/钻练）
  isMeta      Boolean  @default(false) // 元反馈：关于学习方法本身
  createdAt   DateTime @default(now())

  @@index([projectId])
}

model FeynmanNote {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  topic       String
  explanation String // 用大白话解释给外行听
  depthScore  Int? // 1-5 解释深度自检
  gaps        String? // 卡壳点 / 发现的理解漏洞
  createdAt   DateTime @default(now())

  @@index([projectId])
}

model Experiment {
  id          String    @id @default(cuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  question    String // 想验证什么
  methodA     String?
  methodB     String?
  metric      String? // 用什么衡量
  status      String    @default("RUNNING") // RUNNING/CONCLUDED
  conclusion  String?
  createdAt   DateTime  @default(now())
  concludedAt DateTime?

  @@index([projectId])
}

model ProjectReview {
  id          String   @id @default(cuid())
  projectId   String   @unique
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  decision    String // MAINTAIN/RELEARN/MASTER
  summary     String
  nextActions String? // 维持/重学/精通 的后续动作清单
  createdAt   DateTime @default(now())
}

// 九原则检查清单：创建项目时由 lib/principles.ts 模板生成
model ChecklistItem {
  id        String  @id @default(cuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  principle Int // 1-9
  text      String
  isDone    Boolean @default(false)
  sortOrder Int     @default(0)

  @@index([projectId, principle])
}
```

**仪表盘状态推导**（`lib/dashboard.ts`，纯函数、可单测）——每原则三档状态（未开始/进行中/健康）+ 一条建议文案，例如：
- 元学习：why/what/how 是否填写 + 地图条目 ≥5
- 专注：近 7 天会话数、平均分心次数
- 直接性：有无 IN_PROGRESS 的直接练习
- 钻练：OPEN 弱点数 / AWAIT_VERIFY 任务数
- 提取：今日到期卡数、近 7 天检索练习次数
- 保持：逾期未复习卡数（负向信号）
- 反馈/直觉/实验：各实体近期数量（v0.2/v0.3 接入）

---

## 7. 页面 / 路由结构

```
/                          项目列表 + 新建入口
/projects/new              创建向导（4 步：Why → What → How/资源 → 确认）
/projects/[id]             项目工作台首页 = 九原则仪表盘
/projects/[id]/map         元学习地图（主题三类 / 资源 / 访谈）
/projects/[id]/focus       学习会话与番茄钟（含历史）
/projects/[id]/direct      直接练习看板
/projects/[id]/drill       弱点与钻练
/projects/[id]/retrieval   检索（子 tab：今日复习 / 闪卡管理 / 自由回忆 / 问题书 / 闭卷挑战）
/projects/[id]/feedback    反馈（v0.2）
/projects/[id]/intuition   直觉·费曼（v0.2）
/projects/[id]/experiments 实验（v0.3）
/projects/[id]/review      复盘（v0.2）
/settings                  设置：导出、数据文件位置说明、语言占位
```

布局：根布局（中文 `lang="zh-CN"`）→ 项目工作台壳（`[id]/layout.tsx`，项目名 + 九原则侧栏导航，未实现的原则显示"即将上线"）。

---

## 8. API 设计

**MVP 不做 REST 层**：本地单用户、无第三方消费方，Server Actions 最小成本。变更一律走 `"use server"` action（Zod 校验 + revalidatePath），查询走 Server Components 直读 Prisma。对外可编程性由导出文件承担。

**Server Actions 清单**（`server/actions/` 按域分文件）：
- `projects.ts`：createProject（向导整包）、updateProject、changeStatus、deleteProject
- `map.ts`：add/update/deleteTopicItem；addResource、toggleBenchmark、deleteResource；addInterviewNote
- `focus.ts`：startSession、addInterruption、finishSession（含 actualMinutes、focusRating、note）
- `direct.ts`：upsertPractice、startPractice、completePractice
- `drill.ts`：addWeakPoint（可从练习/反馈转入）、resolveWeakPoint、createDrillTask、completeDrillTask（进入 AWAIT_VERIFY）、verifyDrillTask（回填 result → DONE）
- `retrieval.ts`：create/update/deleteCard、suspendCard、reviewCard（SM-2 调度）、createRetrievalExercise
- `feedback.ts`（v0.2）：addFeedback
- `intuition.ts`（v0.2）：createFeynmanNote、scoreFeynmanNote
- `experiments.ts`（v0.3）：createExperiment、concludeExperiment
- `review.ts`（v0.2）：saveProjectReview
- `checklist.ts`：toggleChecklistItem

**Route Handlers**：
- `GET /api/export?projectId=…&format=json|md|csv` → 文件下载（json/md 单文件，csv 为按实体分文件的 zip）
- `GET /api/health` → 版本号 + 数据库连通性（CI 冒烟用）

---

## 9. 目录结构树

```
ultralearning-os/
├── app/
│   ├── layout.tsx                  # 根布局：zh-CN、全局样式、Toast
│   ├── page.tsx                    # 项目列表
│   ├── globals.css
│   ├── projects/
│   │   ├── new/page.tsx            # 创建向导
│   │   └── [id]/
│   │       ├── layout.tsx          # 工作台壳：项目头 + 九原则侧栏
│   │       ├── page.tsx            # 九原则仪表盘
│   │       ├── map/page.tsx
│   │       ├── focus/page.tsx
│   │       ├── direct/page.tsx
│   │       ├── drill/page.tsx
│   │       ├── retrieval/page.tsx
│   │       ├── feedback/page.tsx   # v0.2
│   │       ├── intuition/page.tsx  # v0.2
│   │       ├── experiments/page.tsx# v0.3
│   │       └── review/page.tsx     # v0.2
│   ├── settings/page.tsx
│   └── api/
│       ├── export/route.ts
│       └── health/route.ts
├── components/
│   ├── ui/                         # shadcn/ui 生成组件
│   ├── wizard/                     # 向导各步（客户端组件 + RHF）
│   ├── focus/                      # 番茄钟计时器（Zustand，客户端）
│   ├── retrieval/                  # 复习卡片流、建卡表单
│   ├── dashboard/                  # 原则卡片
│   └── shared/                     # PageHeader、EmptyState、ConfirmDelete
├── server/actions/                 # projects/map/focus/direct/drill/retrieval/...
├── lib/
│   ├── db.ts                       # Prisma 单例
│   ├── sm2.ts                      # 间隔重复纯函数（核心资产，单测覆盖）
│   ├── dashboard.ts                # 原则状态推导纯函数
│   ├── principles.ts               # 九原则元数据：名称/自述/清单模板/建议文案
│   ├── export/                     # md.ts / csv.ts / json.ts
│   ├── i18n.ts
│   ├── validators/                 # 每域 Zod schema
│   └── utils.ts                    # cn() 等
├── messages/zh-CN.ts               # 全部文案（唯一来源）
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                     # 演示项目"Python 数据分析 60 天"
├── tests/
│   ├── unit/                       # sm2 / dashboard / export
│   └── e2e/smoke.spec.ts           # 向导→建卡→复习→仪表盘 主链路
├── docs/
│   ├── PLAN.md                     # 本文档
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
├── .github/workflows/ci.yml
├── README.md  LICENSE(MIT)  CONTRIBUTING.md
└── package.json  pnpm-lock.yaml  tsconfig.json  ...
```

---

## 10. 开发路线图（阶段制，每阶段结束汇报等确认）

| 阶段 | 内容 | 发布 |
|---|---|---|
| 0 地基（半天） | 仓库初始化、脚手架、CI、ESLint/Prettier、LICENSE、README 骨架 | — |
| 1 元学习 | Prisma schema + 迁移 + seed；项目 CRUD；创建向导；学习地图页 | — |
| 2 专注 | 学习会话 + 番茄钟（Zustand 计时、服务端时间戳落库）+ 分心记录 + 会话历史 | — |
| 3 提取 | 闪卡管理 + SM-2 复习队列 + 自由回忆/问题书/闭卷挑战；`lib/sm2.ts` 单测 | — |
| 4 直接性与钻练 | 直接练习看板、弱点、钻练闭环（含 Direct-Then-Drill 引导） | — |
| 5 仪表盘与导出 | 九原则仪表盘、JSON/Markdown 导出、E2E 冒烟、文档齐备 | **v0.1.0 发布** |
| 6 深化 | 反馈三型、费曼直觉、复盘、CSV 导出、专注统计图（Recharts） | v0.2.0 |
| 7 实验 | 实验模块、英文语言包 | v0.3.0 |
| 8 生态 | Postgres 切换指南、JSON 导入、打包分发（Tauri/独立可执行）探索 | 按需 |

---

## 11. GitHub Issue 列表

Milestone **v0.1.0 (MVP)**：

1. `[P0][chore]` **初始化仓库与 CI** — Next.js+TS+pnpm+ESLint/Prettier 脚手架；CI 跑 lint+test+build。验收：`pnpm dev` 可启动，CI 绿。
2. `[P0][chore]` **接入 Prisma+SQLite 与数据模型 v1** — 按 PLAN schema 建模、首次迁移、seed 脚本。验收：迁移成功，seed 产出演示项目。
3. `[P0][feat:metalearning]` **项目列表与 CRUD** — 状态流转（进行/暂停/完成/归档）。验收：增删改查可用。
4. `[P0][feat:metalearning]` **创建向导** — Why/What/How/资源四步，按 10% 规则算研究预算，完成后生成九原则检查清单。验收：向导产出完整 Project + ChecklistItem。
5. `[P0][feat:metalearning]` **学习地图页** — 概念/事实/程序三类主题（增删改+掌握度 0-3）、资源（含基准标记）、访谈记录（内置模板问题）。验收：三类数据均可维护。
6. `[P0][feat:focus]` **学习会话与番茄钟** — 25/5 计时、会话落库、分心一键记录、结束自评。验收：完成一次会话后历史页可见完整记录。
7. `[P0][feat:retrieval]` **闪卡管理与 SM-2 复习** — 建卡（可挂主题）、今日到期队列、四档评分、复习日志。验收：评分后 dueAt/interval 按算法更新，`lib/sm2.ts` 单测过。
8. `[P0][feat:retrieval]` **自由回忆 / 问题书 / 闭卷挑战** — 三种练习创建与覆盖率自评。验收：三种 kind 均可记录并列表展示。
9. `[P0][feat:directness]` **直接练习看板** — 四种形态、状态流转、番茄钟可挂练习。验收：形态筛选与状态流转正确。
10. `[P0][feat:drill]` **弱点与钻练闭环** — 弱点来源标记、钻练切片类型、TODO→DOING→AWAIT_VERIFY→DONE，闭环引导回直接练习。验收：完整走一遍 D→D→D 循环。
11. `[P0][feat:dashboard]` **九原则仪表盘** — 9 张原则卡：检查清单完成度 + 数据推导状态 + 建议文案；`lib/principles.ts` + `lib/dashboard.ts` 纯函数。验收：空项目和活跃项目的状态区分正确。
12. `[P1][feat:export]` **JSON / Markdown 导出** — 按项目导出；Markdown 为可读报告（地图、统计、日志、弱点钻练记录）。验收：下载文件内容完整可读。
13. `[P1][test]` **单元测试** — sm2 / dashboard / export。验收：核心分支覆盖，CI 通过。
14. `[P1][test]` **Playwright 冒烟** — 创建项目→建卡→复习→看仪表盘。验收：CI e2e job 绿。
15. `[P1][docs]` **README / ARCHITECTURE / CONTRIBUTING** — 新手 10 分钟能跑起来；含版权声明。验收：按 README 从零 clone 到启动无障碍。

Milestone **v0.2.0**：

16. `[P1][feat:feedback]` **反馈记录** — 三型+来源+元反馈标志，可一键转弱点。验收：类型筛选与"转弱点"链路可用。
17. `[P1][feat:intuition]` **费曼笔记与深度自检** — 解释+1-5 深度分+卡壳点。验收：创建/评分/列表可用。
18. `[P1][feat:review]` **项目复盘** — 维持/重学/精通三选一+后续动作，完成项目时引导。验收：复盘后项目状态与动作清单正确。
19. `[P1][feat:export]` **CSV 导出** — sessions/cards/reviews/drills 分文件 zip。验收：Excel/WPS 打开中文不乱码（UTF-8 BOM）。
20. `[P2][feat:retention]` **保持策略清单与逾期提醒** — 程序化/过度学习/助记勾选项进入原则 7 清单模板；仪表盘保持卡显示逾期卡数。验收：逾期卡在仪表盘可见。
21. `[P2][feat:focus]` **专注统计图** — 近 30 天会话时长/分心趋势（Recharts）。验收：有数据的项目渲染正确。

Milestone **v0.3.0+**：

22. `[P2][feat:experimentation]` **方法 A/B 实验卡** — 问题/两法/指标/结论，仪表盘实验卡接入。验收：实验全生命周期可记录。
23. `[P2][feat:i18n]` **英文语言包** — 全部文案已收敛到 messages，新增 `en`。验收：切换语言无硬编码残留。
24. `[P3][chore]` **Postgres 切换指南** — provider/env/迁移差异文档 + docker-compose。验收：按文档可切库跑通。
25. `[P3][feat]` **JSON 导入** — 换机迁移/备份恢复。验收：导出的 JSON 可完整还原。
26. `[P3][idea]` **桌面分发探索** — Tauri 包装或 standalone 可执行。验收：产出可行性结论。

---

## 12. README.md 草稿

````markdown
# Ultralearning OS

> 把《Ultralearning》的九大原则，变成可执行、可追踪、可复盘的学习工作流。

Ultralearning OS 是一个**本地优先**的开源学习项目管理系统。它不是又一个闪卡或待办工具，
而是围绕"一个学习项目"的完整方法论脚手架：从开局画地图（元学习），到直接练习、钻练弱点、
检索测试、收集反馈，直到项目复盘（维持 / 重学 / 精通）。

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

```bash
pnpm install
pnpm db:setup   # 初始化 SQLite 并写入演示数据（可选）
pnpm dev        # 打开 http://localhost:3000
```

## 技术栈

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Prisma + SQLite ·
Zod + React Hook Form · Zustand · Vitest · Playwright

## 数据与隐私

所有数据保存在本地 `prisma/dev.db` 单文件中：没有账号、没有上传、没有遥测。
`/settings` 页可随时导出 Markdown / JSON / CSV。

## 路线图

见 [ROADMAP.md](docs/ROADMAP.md)。当前：v0.1.0（MVP）。

## 说明与致谢

本项目受 Scott H. Young《Ultralearning》启发，仅引用其原则名称与概念，
并以我们自己的语言重新描述，不包含原书文本。方法论请阅读原书。

## License

MIT
````

---

## 13. 风险、取舍与扩展方向

**风险与对策**：
1. **版权合规（红线）**：只用原则名称与概念、全部自撰描述；README 明示非官方并引导购书；界面不放原书引文。
2. **范围蔓延**：12 个功能域全做必烂尾 → milestone 门控 + 每阶段汇报确认，反馈/直觉/复盘果断移出 MVP。
3. **复习算法**：先用简化 SM-2（~60 行纯函数、可解释、好测），`lib/sm2.ts` 接口隔离，未来可换 FSRS 而不动 UI。
4. **本地优先 × 使用门槛**：要求 Node + pnpm，对非开发者不友好 → MVP 接受并在 README 写清楚，v0.3+ 探索打包分发。
5. **SQLite 能力限制**：无 enum/Json → String + Zod（已定）。
6. **番茄钟时钟漂移**：客户端只做展示计时，落库以服务端时间戳为准。
7. **单文件库丢失**：文档写明备份方式（复制 db 文件）+ 导出兜底。
8. **本机工程环境**：GitHub 推送走 SSH 443（workflows 必须 SSH）；pnpm 12 放行 prisma/esbuild 构建脚本；npm 缓存重定向已由 AgentDiskGuard 处理。

**后续扩展方向**（不进近期 milestone）：FSRS 算法、AI 辅助（模拟导师提问、从笔记自动出卡，可接本地 LLM）、社区项目模板库、Anki 卡组导入、PWA 移动端、日历集成。

---

## 待你确认的决策点

1. 项目目录 `E:\Users\luo17\AppData\Programs\Zcode\ultralearning-os`、仓库名 `ultralearning-os`、public —— 可以吗？
2. MVP 裁剪：反馈/直觉/复盘放 v0.2 而非 MVP —— 认可吗？
3. 复习算法先用简化 SM-2（预留 FSRS）—— 可以吗？
4. MVP 不做 REST API（Server Actions + 导出 Route Handler）—— 可以吗？
5. 路线图按"阶段制"推进、每阶段结束汇报等确认（同你设定的工作方式）—— 可以吗？
