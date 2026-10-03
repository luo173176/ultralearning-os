import Dexie, { type Table } from "dexie";

import { notifyDataChanged } from "./events";

// 网页版数据层：IndexedDB（Dexie），表结构与 prisma/schema.prisma 一一对应。
// 日期一律存 Date 对象（IndexedDB 原生支持），组件层的类型与本地版完全一致。
// 枚举仍为 String + lib/validators 的 Zod 校验（与本地版同一套）。

export type DbProject = {
  id: string;
  name: string;
  why: string | null;
  what: string | null;
  how: string | null;
  category: string; // LANGUAGE/CODING/EXAM/SKILL/OTHER
  status: string; // ACTIVE/PAUSED/COMPLETED/ARCHIVED
  plannedHours: number;
  researchBudget: number;
  deadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DbTopic = {
  id: string;
  projectId: string;
  name: string;
  kind: string; // CONCEPT/FACT/PROCEDURE
  mastery: number; // 0-3
  notes: string | null;
  sortOrder: number;
};

export type DbResource = {
  id: string;
  projectId: string;
  title: string;
  url: string | null;
  type: string;
  isBenchmark: boolean;
  notes: string | null;
  createdAt: Date;
};

export type DbInterview = {
  id: string;
  projectId: string;
  expert: string;
  content: string;
  createdAt: Date;
};

export type DbSession = {
  id: string;
  projectId: string;
  practiceId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  plannedMinutes: number;
  actualMinutes: number | null;
  focusRating: number | null;
  note: string | null;
};

export type DbInterruption = {
  id: string;
  sessionId: string;
  at: Date;
  reason: string;
  seconds: number;
};

export type DbPractice = {
  id: string;
  projectId: string;
  title: string;
  form: string; // PROJECT/IMMERSION/SIMULATION/OVERKILL
  description: string | null;
  status: string; // PLANNED/IN_PROGRESS/DONE
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
};

export type DbWeakPoint = {
  id: string;
  projectId: string;
  practiceId: string | null;
  title: string;
  detail: string | null;
  source: string; // SELF/PRACTICE/FEEDBACK/RETRIEVAL
  status: string; // OPEN/DRILLING/RESOLVED
  createdAt: Date;
};

export type DbDrill = {
  id: string;
  projectId: string;
  weakPointId: string;
  title: string;
  sliceType: string;
  status: string; // TODO/DOING/AWAIT_VERIFY/DONE
  result: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

export type DbCard = {
  id: string;
  projectId: string;
  topicItemId: string | null;
  front: string;
  back: string;
  dueAt: Date;
  intervalDays: number;
  easeFactor: number;
  reps: number;
  lapses: number;
  suspended: boolean;
};

export type DbReviewLog = {
  id: string;
  cardId: string;
  reviewedAt: Date;
  grade: string;
  intervalDays: number;
  easeFactor: number;
};

export type DbExercise = {
  id: string;
  projectId: string;
  kind: string; // FREE_RECALL/QUESTION_BOOK/CLOSED_BOOK
  title: string;
  prompt: string | null;
  content: string | null;
  coverage: number | null;
  createdAt: Date;
};

export type DbChecklist = {
  id: string;
  projectId: string;
  principle: number; // 1-9
  text: string;
  isDone: boolean;
  sortOrder: number;
};

// ---------- 预留（v0.2/v0.3 模块） ----------

export type DbFeedback = {
  id: string;
  projectId: string;
  type: string;
  source: string;
  content: string;
  actionTaken: string | null;
  isMeta: boolean;
  createdAt: Date;
};

export type DbFeynman = {
  id: string;
  projectId: string;
  topic: string;
  explanation: string;
  depthScore: number | null;
  gaps: string | null;
  createdAt: Date;
};

export type DbExperiment = {
  id: string;
  projectId: string;
  question: string;
  methodA: string | null;
  methodB: string | null;
  metric: string | null;
  status: string;
  conclusion: string | null;
  createdAt: Date;
  concludedAt: Date | null;
};

export class UltralearningDB extends Dexie {
  projects!: Table<DbProject, string>;
  topicItems!: Table<DbTopic, string>;
  resources!: Table<DbResource, string>;
  interviews!: Table<DbInterview, string>;
  sessions!: Table<DbSession, string>;
  interruptions!: Table<DbInterruption, string>;
  directPractices!: Table<DbPractice, string>;
  weakPoints!: Table<DbWeakPoint, string>;
  drillTasks!: Table<DbDrill, string>;
  cards!: Table<DbCard, string>;
  reviewLogs!: Table<DbReviewLog, string>;
  retrievalExercises!: Table<DbExercise, string>;
  checklistItems!: Table<DbChecklist, string>;
  feedbackEntries!: Table<DbFeedback, string>;
  feynmanNotes!: Table<DbFeynman, string>;
  experiments!: Table<DbExperiment, string>;

  constructor() {
    super("ultralearning-os");
    this.version(1).stores({
      projects: "id, status, updatedAt",
      topicItems: "id, projectId, [projectId+kind]",
      resources: "id, projectId, createdAt",
      interviews: "id, projectId, createdAt",
      sessions: "id, projectId, practiceId, startedAt",
      interruptions: "id, sessionId",
      directPractices: "id, projectId, status",
      weakPoints: "id, projectId, practiceId, status",
      drillTasks: "id, projectId, weakPointId, status",
      cards: "id, projectId, topicItemId, dueAt, [projectId+suspended]",
      reviewLogs: "id, cardId, reviewedAt",
      retrievalExercises: "id, projectId, kind, createdAt",
      checklistItems: "id, projectId, [projectId+principle]",
      feedbackEntries: "id, projectId",
      feynmanNotes: "id, projectId",
      experiments: "id, projectId",
    });
  }
}

export const db = new UltralearningDB();

export function uid(): string {
  return crypto.randomUUID();
}

export function now(): Date {
  return new Date();
}

/** 一次性清空全部数据（导入前调用） */
export async function wipeAll(): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.projects,
      db.topicItems,
      db.resources,
      db.interviews,
      db.sessions,
      db.interruptions,
      db.directPractices,
      db.weakPoints,
      db.drillTasks,
      db.cards,
      db.reviewLogs,
      db.retrievalExercises,
      db.checklistItems,
      db.feedbackEntries,
      db.feynmanNotes,
      db.experiments,
    ],
    async () => {
      await Promise.all([
        db.projects.clear(),
        db.topicItems.clear(),
        db.resources.clear(),
        db.interviews.clear(),
        db.sessions.clear(),
        db.interruptions.clear(),
        db.directPractices.clear(),
        db.weakPoints.clear(),
        db.drillTasks.clear(),
        db.cards.clear(),
        db.reviewLogs.clear(),
        db.retrievalExercises.clear(),
        db.checklistItems.clear(),
        db.feedbackEntries.clear(),
        db.feynmanNotes.clear(),
        db.experiments.clear(),
      ]);
    },
  );
  notifyDataChanged();
}
