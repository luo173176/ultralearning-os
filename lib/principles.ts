// 九大原则的领域数据：名称、自撰一句话释义、检查清单模板。
// 全部为原创描述（不含《Ultralearning》原文），创建项目时由向导据此生成 ChecklistItem。

export const PRINCIPLES = [
  {
    key: "metalearning",
    order: 1,
    zh: "元学习",
    en: "Metalearning",
    tagline: "先画地图：动手前搞清楚学什么、怎么学、学到什么程度。",
    checklist: [
      "完成 Why / What / How 三问（创建向导）",
      "列出主题清单并分为概念 / 事实 / 程序",
      "找到至少 1 个基准资源，知道高手做到什么程度",
      "完成一次专家访谈或深度请教",
      "研究投入控制在总时长的 10% 以内",
    ],
  },
  {
    key: "focus",
    order: 2,
    zh: "专注",
    en: "Focus",
    tagline: "磨快你的刀：整块、无干扰的时间是学习质量的下限。",
    checklist: [
      "固定每日学习时段",
      "学习时隔离手机等干扰源",
      "用番茄钟完整完成至少 1 次会话",
      "记录分心并定期复盘分心来源",
    ],
  },
  {
    key: "directness",
    order: 3,
    zh: "直接性",
    en: "Directness",
    tagline: "直接去做：在真实场景里练真本事，而不是只做替代练习。",
    checklist: [
      "定义 1 个真实产出物（项目 / 作品 / 考试）",
      "确定直接练习形态：项目式 / 沉浸 / 模拟 / Overkill",
      "大部分学习时间花在直接练习上",
    ],
  },
  {
    key: "drill",
    order: 4,
    zh: "钻练",
    en: "Drill",
    tagline: "攻击最弱点：找到短板，切片隔离，集中火力攻克。",
    checklist: [
      "从直接练习中识别出弱点并记录",
      "为弱点创建钻练任务并选择切片类型",
      "钻练完成后回到直接练习验证效果",
    ],
  },
  {
    key: "retrieval",
    order: 5,
    zh: "提取",
    en: "Retrieval",
    tagline: "用测试来学习：合上书回忆，比重读有效得多。",
    checklist: [
      "为核心知识创建闪卡",
      "完成一次自由回忆并自评覆盖率",
      "用问题书定期自测",
      "至少完成一次闭卷挑战",
    ],
  },
  {
    key: "feedback",
    order: 6,
    zh: "反馈",
    en: "Feedback",
    tagline: "不要躲拳头：主动寻找即时、真实、可行动的反馈。",
    checklist: [
      "记录结果 / 信息 / 纠正三型反馈各至少 1 条",
      "确定反馈来源：导师 / 同伴 / 工具",
      "记录 1 条元反馈（对学习方法本身的反馈）",
    ],
  },
  {
    key: "retention",
    order: 7,
    zh: "保持",
    en: "Retention",
    tagline: "不要填漏桶：用间隔重复和过度学习对抗遗忘。",
    checklist: [
      "清空今日到期闪卡",
      "为易忘内容创建助记",
      "把陈述性知识转化为程序性练习",
      "对关键技能做超出「刚好会」的过度学习",
    ],
  },
  {
    key: "intuition",
    order: 8,
    zh: "直觉",
    en: "Intuition",
    tagline: "先深挖再搭建：吃透具体例子，直到能凭感觉判断。",
    checklist: [
      "用费曼技巧向假想外行解释核心概念",
      "收集并吃透具体例子",
      "给解释深度打分并记录卡壳点",
    ],
  },
  {
    key: "experimentation",
    order: 9,
    zh: "实验",
    en: "Experimentation",
    tagline: "探索舒适区外：把学习方法本身当作实验对象。",
    checklist: [
      "提出 1 个可验证的学习方法问题",
      "设计 A/B 对比实验并定义衡量指标",
      "记录实验结论并据此调整方法",
    ],
  },
] as const;

export type PrincipleKey = (typeof PRINCIPLES)[number]["key"];

export function getPrinciple(key: string) {
  return PRINCIPLES.find((p) => p.key === key);
}
