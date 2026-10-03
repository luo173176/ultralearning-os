export const zhCN = {
  "app.name": "Ultralearning OS",
  "app.description":
    "把《Ultralearning》九大原则变成可执行、可追踪、可复盘学习工作流的本地优先学习项目管理系统",
  "app.tagline": "先画地图，直接去做，攻击最弱点，用测试来学习。",
  "home.title": "项目",
  "home.subtitle": "一个项目一段能力，从画好地图开始。",
  "home.emptyTitle": "还没有学习项目",
  "home.emptyDescription":
    "用 15 分钟完成创建向导：Why → What → How，自动生成九原则检查清单。",
  "nav.newProject": "新建项目",
  "wizard.title": "创建超学习项目",
  "wizard.subtitle":
    "四步画好学习地图：Why → What → How → 确认。研究预算按 10% 规则自动计算。",
} as const;

export type MessageKey = keyof typeof zhCN;
