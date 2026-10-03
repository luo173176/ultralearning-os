# 方案：网页版（GitHub Pages 浏览器版）v1

> 状态：**已上线**（2026-10-03）：https://luo173176.github.io/ultralearning-os/ ，commit e3b90ea 起部署 workflow 全绿。前提（用户已确认）：手机上不需要电脑的数据，每台设备独立存储。
> 上位文档：PLAN.md（产品方案）。本地 Next.js + SQLite 版（v0.1.0）保留不动，双版本并存。

## 1. 目标与形态

把 ultralearning-os 变成**纯浏览器应用**部署到 GitHub Pages：
- 手机浏览器打开 `https://luo173176.github.io/ultralearning-os/`，"添加到主屏幕"后像原生 App 一样全屏使用
- 数据存在**该设备浏览器的 IndexedDB** 里：手机一份、电脑一份，互不相干（已确认）
- 零服务器、零成本；github.io 国内可达（画伴等三个项目已验证）
- 无需账号口令（数据在设备本地）

## 2. 技术选型（沿用画伴已验证的组合）

| 项 | 选择 | 理由 |
|---|---|---|
| 构建 | Vite 6 + React 19 + TS | 纯 SPA 首选；Pages 产物为静态文件 |
| 路由 | react-router-dom 6，**HashRouter** | Pages 刷新不 404（drawmate 踩过坑） |
| 样式/UI | Tailwind 4 + shadcn 组件原样复用 | 现有组件 95% 可直接搬 |
| 数据 | **Dexie.js**（IndexedDB 封装）+ dexie-react-hooks 的 `useLiveQuery` | 数据变更自动重渲染，天然替代 revalidatePath/router.refresh |
| PWA | vite-plugin-pwa：manifest + Service Worker | 添加到主屏幕 + **离线可用**（通勤无网也能复习闪卡） |
| 部署 | GitHub Actions 构建 webapp/，Pages 从 workflow 部署 | Pages 开通用 API：`gh api -X POST repos/<o>/<r>/pages -f build_type=workflow`（drawmate 坑） |

## 3. 数据层抽象（核心设计）

接口与现有 Server Action 签名保持一致，组件只需换 import：

```ts
// lib/storage/types.ts
export interface Storage {
  listProjects(): Promise<ProjectCardData[]>
  createProject(input: WizardInput): Promise<ActionResult<{ id: string }>>
  updateProject(id: string, input: ProjectFieldsInput): Promise<ActionResult>
  changeProjectStatus(id: string, status: ProjectStatus): Promise<ActionResult>
  deleteProject(id: string): Promise<ActionResult>
  // map / focus / retrieval / direct / drill / checklist 六个域，
  // 与 server/actions/*.ts 现有方法一一对应（addTopicItem、reviewCard、verifyDrill…）
}
export const storage: Storage  // 当前激活的实现
```

- `lib/storage/dexie.ts`：Dexie 实现。表结构与 Prisma 模型一一对应（17 张表、枚举仍为 String、级联删除手工实现）；ID 沿用 cuid 风格字符串
- **可原样复用的资产**（估算占代码量 ~60%）：`lib/` 下 sm2、dashboard、focus、principles、domain、validators、export/markdown、templates、i18n、utils 全部纯函数 + `messages/`；`components/` 的向导、面板、看板组件（仅改 server action 的 import 为 storage 调用）
- 需要重写的：`app/` 的 9 个 Server Component 页面 → 客户端页面 + useLiveQuery；`server/actions/` → Dexie 实现；`/api/export` → Blob 下载（markdown.ts 纯函数直接吃 Dexie 读出的同构数据）
- **顺手提前**：JSON 导入（原 v0.3 计划）在此版本必须做——它是换手机/清浏览器的唯一恢复手段，与导出并列入"设置"入口

## 4. 已知取舍（诚实清单）

1. 每台设备独立数据（已确认接受）；换设备 = 导出 JSON → 新设备导入
2. 浏览器"清除网站数据"会删库 → 导出/导入放显眼位置；PWA 安装后不易误触
3. 双版本并存（本地 Next + 网页版）：后续新功能默认先做网页版（使用频率更高），本地版按需同步
4. 番茄钟的 Zustand persist 在浏览器端照常工作；后台计时不精确的问题同样以服务端……网页版无服务端，改为**以开始时间戳推算**（现有 elapsedMs 纯函数已如此设计，直接成立）

## 5. 阶段划分（每阶段结束汇报等确认）

| 阶段 | 内容 | 产出 |
|---|---|---|
| **6a 脚手架** | `webapp/` 子目录（独立 package.json，不动根上 Next 版本）：Vite+Tailwind+Dexie+HashRouter+PWA 配置；storage 接口 + Dexie 实现；纯函数层接入与单测 | 空壳页面可跑，单测绿 |
| **6b 页面迁移（上）** | 项目列表、创建向导、工作台壳+导航、九原则仪表盘、学习地图 | 核心链路可用 |
| **6c 页面迁移（下）+ 上线** | 会话/检索/直接练习/钻练；Markdown/JSON 导出 + JSON 导入；Pages 部署（API 开通 + workflow + base 路径）；手机真机走查 | **发布网页版 v0.1** |

## 6. 验收标准

- 手机浏览器打开网址 → 向导建项目 → 加闪卡 → 番茄钟 → 复习 → 仪表盘状态变化 → 导出 MD
- 添加到主屏幕后全屏运行；飞行模式下已加载页面可复习闪卡
- 换设备：导出 JSON → 导入 → 数据完整还原
- 本地 Next 版 v0.1.0 不受任何影响
