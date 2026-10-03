import { z } from "zod";

// ---------- 枚举与中文标签（SQLite 无 enum，值以 String 存库，这里集中定义 + Zod 校验） ----------

export const PROJECT_STATUSES = [
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; badge: "default" | "secondary" | "outline" }
> = {
  ACTIVE: { label: "进行中", badge: "default" },
  PAUSED: { label: "已暂停", badge: "secondary" },
  COMPLETED: { label: "已完成", badge: "outline" },
  ARCHIVED: { label: "已归档", badge: "outline" },
};

export const CATEGORIES = ["CODING", "EXAM", "LANGUAGE", "SKILL", "OTHER"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<Category, string> = {
  CODING: "编程技术",
  EXAM: "考试备考",
  LANGUAGE: "语言",
  SKILL: "软技能",
  OTHER: "其他",
};

export const TOPIC_KINDS = ["CONCEPT", "FACT", "PROCEDURE"] as const;
export type TopicKind = (typeof TOPIC_KINDS)[number];
export const TOPIC_KIND_LABELS: Record<TopicKind, string> = {
  CONCEPT: "概念",
  FACT: "事实",
  PROCEDURE: "程序",
};

export const MASTERY_LEVELS = [0, 1, 2, 3] as const;
export const MASTERY_LABELS = ["未学", "学习中", "可输出", "可教别人"] as const;

export const RESOURCE_TYPES = [
  "COURSE",
  "BOOK",
  "VIDEO",
  "MENTOR",
  "COMMUNITY",
  "OTHER",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];
export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  COURSE: "课程",
  BOOK: "书籍",
  VIDEO: "视频",
  MENTOR: "导师",
  COMMUNITY: "社区",
  OTHER: "其他",
};

// 阶段 4 使用，schema 已预留
export const PRACTICE_FORMS = [
  "PROJECT",
  "IMMERSION",
  "SIMULATION",
  "OVERKILL",
] as const;
export const PRACTICE_FORM_LABELS: Record<
  (typeof PRACTICE_FORMS)[number],
  string
> = {
  PROJECT: "项目式",
  IMMERSION: "沉浸式",
  SIMULATION: "模拟练习",
  OVERKILL: "Overkill 挑战",
};

export const PRACTICE_STATUSES = ["PLANNED", "IN_PROGRESS", "DONE"] as const;
export type PracticeStatus = (typeof PRACTICE_STATUSES)[number];
export const PRACTICE_STATUS_META: Record<
  PracticeStatus,
  { label: string; badge: "default" | "secondary" | "outline" }
> = {
  PLANNED: { label: "计划中", badge: "secondary" },
  IN_PROGRESS: { label: "进行中", badge: "default" },
  DONE: { label: "已完成", badge: "outline" },
};

export const WEAK_POINT_SOURCES = [
  "SELF",
  "PRACTICE",
  "FEEDBACK",
  "RETRIEVAL",
] as const;
export type WeakPointSource = (typeof WEAK_POINT_SOURCES)[number];
export const WEAK_POINT_SOURCE_LABELS: Record<WeakPointSource, string> = {
  SELF: "自查发现",
  PRACTICE: "来自练习",
  FEEDBACK: "来自反馈",
  RETRIEVAL: "来自检索错误",
};

export const WEAK_POINT_STATUSES = ["OPEN", "DRILLING", "RESOLVED"] as const;
export type WeakPointStatus = (typeof WEAK_POINT_STATUSES)[number];
export const WEAK_POINT_STATUS_META: Record<
  WeakPointStatus,
  { label: string; badge: "default" | "secondary" | "outline" | "destructive" }
> = {
  OPEN: { label: "未攻克", badge: "destructive" },
  DRILLING: { label: "钻练中", badge: "default" },
  RESOLVED: { label: "已解决", badge: "outline" },
};

export const DRILL_SLICE_TYPES = [
  "TIME_SLICE",
  "COGNITIVE_SLICE",
  "COPYCAT",
  "MAGNIFIER",
  "PREREQUISITE",
] as const;
export type DrillSliceType = (typeof DRILL_SLICE_TYPES)[number];
export const DRILL_SLICE_LABELS: Record<DrillSliceType, string> = {
  TIME_SLICE: "时间切片",
  COGNITIVE_SLICE: "认知切片",
  COPYCAT: "复制模仿",
  MAGNIFIER: "放大镜法",
  PREREQUISITE: "前提隔离",
};

export const DRILL_STATUSES = [
  "TODO",
  "DOING",
  "AWAIT_VERIFY",
  "DONE",
] as const;
export type DrillStatus = (typeof DRILL_STATUSES)[number];
export const DRILL_STATUS_META: Record<
  DrillStatus,
  { label: string; badge: "default" | "secondary" | "outline" | "destructive" }
> = {
  TODO: { label: "待开始", badge: "secondary" },
  DOING: { label: "钻练中", badge: "default" },
  AWAIT_VERIFY: { label: "待验证", badge: "destructive" },
  DONE: { label: "已验证", badge: "outline" },
};

// ---------- 领域规则 ----------

/** 10% 研究规则：研究预算 = 计划总时长的 10%，向上取整 */
export function calcResearchBudget(plannedHours: number): number {
  if (!Number.isFinite(plannedHours) || plannedHours <= 0) return 0;
  return Math.ceil(plannedHours * 0.1);
}

export const categorySchema = z.enum(CATEGORIES);
