import type { ActionResult } from "@/lib/action-result";
import { calcResearchBudget, PROJECT_STATUSES } from "@/lib/domain";
import { PRINCIPLES } from "@/lib/principles";
import { schedule } from "@/lib/sm2";
import {
  interviewNoteSchema,
  resourceInputSchema,
  topicInputSchema,
  updateTopicItemSchema,
} from "@/lib/validators/map";
import {
  finishSessionSchema,
  interruptionInputSchema,
  startSessionSchema,
} from "@/lib/validators/focus";
import {
  cardInputSchema,
  gradeSchema,
  retrievalExerciseSchema,
} from "@/lib/validators/retrieval";
import {
  practiceInputSchema,
  practiceStatusSchema,
} from "@/lib/validators/direct";
import {
  drillInputSchema,
  drillVerifySchema,
  weakPointInputSchema,
} from "@/lib/validators/drill";
import {
  projectFieldsSchema,
  wizardSchema,
} from "@/lib/validators/project";

import { notifyDataChanged } from "./events";
import { db, now, uid, type DbPractice, type DbProject } from "./db";

function firstError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "输入不合法";
}

function toDeadline(s: string): Date | null {
  return s ? new Date(`${s}T00:00:00`) : null;
}

// ---------- 项目 ----------

export type ProjectListItem = {
  id: string;
  name: string;
  why: string | null;
  status: string;
  category: string;
  deadline: Date | null;
  updatedAt: Date;
  topicCount: number;
  resourceCount: number;
};

export async function listProjects(): Promise<ProjectListItem[]> {
  const [projects, topics, resources] = await Promise.all([
    db.projects.toArray(),
    db.topicItems.toArray(),
    db.resources.toArray(),
  ]);
  return projects
    .map((p) => ({
      id: p.id,
      name: p.name,
      why: p.why,
      status: p.status,
      category: p.category,
      deadline: p.deadline,
      updatedAt: p.updatedAt,
      topicCount: topics.filter((t) => t.projectId === p.id).length,
      resourceCount: resources.filter((r) => r.projectId === p.id).length,
    }))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getProject(
  projectId: string,
): Promise<DbProject | undefined> {
  return db.projects.get(projectId);
}

export async function createProject(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = wizardSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const input = parsed.data;
  const deadline = toDeadline(input.deadline);
  const ts = now();
  const id = uid();

  await db.transaction(
    "rw",
    [db.projects, db.topicItems, db.resources, db.checklistItems],
    async () => {
      await db.projects.add({
        id,
        name: input.name,
        category: input.category,
        why: input.why || null,
        what: input.what || null,
        how: input.how || null,
        status: "ACTIVE",
        plannedHours: input.plannedHours,
        researchBudget: calcResearchBudget(input.plannedHours),
        deadline,
        createdAt: ts,
        updatedAt: ts,
      });
      if (input.topics.length > 0) {
        await db.topicItems.bulkAdd(
          input.topics.map((t, i) => ({
            id: uid(),
            projectId: id,
            name: t.name,
            kind: t.kind,
            mastery: 0,
            notes: null,
            sortOrder: i,
          })),
        );
      }
      if (input.resources.length > 0) {
        await db.resources.bulkAdd(
          input.resources.map((r) => ({
            id: uid(),
            projectId: id,
            title: r.title,
            url: r.url || null,
            type: r.type,
            isBenchmark: r.isBenchmark,
            notes: null,
            createdAt: ts,
          })),
        );
      }
      await db.checklistItems.bulkAdd(
        PRINCIPLES.flatMap((p) =>
          p.checklist.map((text, i) => ({
            id: uid(),
            projectId: id,
            principle: p.order,
            text,
            isDone: false,
            sortOrder: i,
          })),
        ),
      );
    },
  );
  notifyDataChanged();
  return { ok: true, data: { id } };
}

export async function updateProject(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = projectFieldsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const input = parsed.data;
  const project = await db.projects.get(projectId);
  if (!project) return { ok: false, error: "项目不存在" };
  const deadline = toDeadline(input.deadline);
  await db.projects.update(projectId, {
    name: input.name,
    category: input.category,
    why: input.why || null,
    what: input.what || null,
    how: input.how || null,
    plannedHours: input.plannedHours,
    researchBudget: calcResearchBudget(input.plannedHours),
    deadline,
    updatedAt: now(),
  });
  notifyDataChanged();
  return { ok: true };
}

export async function changeProjectStatus(
  projectId: string,
  status: string,
): Promise<ActionResult> {
  if (!(PROJECT_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "未知状态" };
  }
  await db.projects.update(projectId, { status, updatedAt: now() });
  notifyDataChanged();
  return { ok: true };
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  // 级联删除全部子表数据
  const [topicIds, sessionIds, practiceIds, weakPointIds] = await Promise.all([
    db.topicItems.where("projectId").equals(projectId).primaryKeys(),
    db.sessions.where("projectId").equals(projectId).primaryKeys(),
    db.directPractices.where("projectId").equals(projectId).primaryKeys(),
    db.weakPoints.where("projectId").equals(projectId).primaryKeys(),
  ]);
  const interruptionIds = (
    await db.interruptions.toArray()
  )
    .filter((i) => sessionIds.includes(i.sessionId))
    .map((i) => i.id);
  const drillIds = (
    await db.drillTasks.toArray()
  )
    .filter((d) => weakPointIds.includes(d.weakPointId))
    .map((d) => d.id);
  const cardIds = await db.cards.where("projectId").equals(projectId).primaryKeys();
  const reviewLogIds = (
    await db.reviewLogs.toArray()
  )
    .filter((l) => cardIds.includes(l.cardId))
    .map((l) => l.id);

  await db.transaction(
    "rw",
    [db.projects, db.topicItems, db.resources, db.interviews, db.sessions, db.interruptions, db.directPractices, db.weakPoints, db.drillTasks, db.cards, db.reviewLogs, db.retrievalExercises, db.checklistItems],
    async () => {
      await Promise.all([
        db.projects.delete(projectId),
        db.topicItems.bulkDelete(topicIds),
        db.resources.where("projectId").equals(projectId).delete(),
        db.interviews.where("projectId").equals(projectId).delete(),
        db.sessions.bulkDelete(sessionIds),
        db.interruptions.bulkDelete(interruptionIds),
        db.directPractices.bulkDelete(practiceIds),
        db.weakPoints.bulkDelete(weakPointIds),
        db.drillTasks.bulkDelete(drillIds),
        db.cards.bulkDelete(cardIds),
        db.reviewLogs.bulkDelete(reviewLogIds),
        db.retrievalExercises.where("projectId").equals(projectId).delete(),
        db.checklistItems.where("projectId").equals(projectId).delete(),
      ]);
    },
  );
  notifyDataChanged();
  return { ok: true };
}

// ---------- 学习地图 ----------

export async function addTopicItem(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = topicInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const count = await db.topicItems.where("projectId").equals(projectId).count();
  await db.topicItems.add({
    id: uid(),
    projectId,
    ...parsed.data,
    mastery: 0,
    notes: null,
    sortOrder: count,
  });
  notifyDataChanged();
  return { ok: true };
}

export async function updateTopicItem(
  projectId: string,
  itemId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = updateTopicItemSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const item = await db.topicItems.get(itemId);
  if (!item || item.projectId !== projectId) return { ok: false, error: "主题不存在" };
  await db.topicItems.update(itemId, parsed.data);
  notifyDataChanged();
  return { ok: true };
}

export async function deleteTopicItem(
  _projectId: string,
  itemId: string,
): Promise<ActionResult> {
  await db.topicItems.delete(itemId);
  notifyDataChanged();
  return { ok: true };
}

export async function addResource(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = resourceInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await db.resources.add({
    id: uid(),
    projectId,
    title: parsed.data.title,
    url: parsed.data.url || null,
    type: parsed.data.type,
    isBenchmark: parsed.data.isBenchmark,
    notes: null,
    createdAt: now(),
  });
  notifyDataChanged();
  return { ok: true };
}

export async function toggleResourceBenchmark(
  _projectId: string,
  resourceId: string,
  isBenchmark: boolean,
): Promise<ActionResult> {
  await db.resources.update(resourceId, { isBenchmark });
  notifyDataChanged();
  return { ok: true };
}

export async function deleteResource(
  _projectId: string,
  resourceId: string,
): Promise<ActionResult> {
  await db.resources.delete(resourceId);
  notifyDataChanged();
  return { ok: true };
}

export async function addInterviewNote(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = interviewNoteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await db.interviews.add({
    id: uid(),
    projectId,
    ...parsed.data,
    createdAt: now(),
  });
  notifyDataChanged();
  return { ok: true };
}

export async function deleteInterviewNote(
  _projectId: string,
  noteId: string,
): Promise<ActionResult> {
  await db.interviews.delete(noteId);
  notifyDataChanged();
  return { ok: true };
}

// ---------- 学习会话 ----------

export async function startSession(
  projectId: string,
  raw: unknown,
): Promise<ActionResult<{ sessionId: string; startedAtIso: string }>> {
  const parsed = startSessionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };

  let practiceId: string | null = null;
  if (parsed.data.practiceId) {
    const practice = await db.directPractices.get(parsed.data.practiceId);
    if (!practice || practice.projectId !== projectId) {
      return { ok: false, error: "关联的练习不存在" };
    }
    practiceId = practice.id;
  }

  const startedAt = now();
  const sessionId = uid();
  await db.sessions.add({
    id: sessionId,
    projectId,
    practiceId,
    startedAt,
    endedAt: null,
    plannedMinutes: parsed.data.plannedMinutes,
    actualMinutes: null,
    focusRating: null,
    note: null,
  });
  notifyDataChanged();
  return { ok: true, data: { sessionId, startedAtIso: startedAt.toISOString() } };
}

export async function addInterruption(
  projectId: string,
  sessionId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = interruptionInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const session = await db.sessions.get(sessionId);
  if (!session || session.projectId !== projectId) return { ok: false, error: "会话不存在" };
  await db.interruptions.add({ id: uid(), sessionId, ...parsed.data, at: now() });
  notifyDataChanged();
  return { ok: true };
}

export async function finishSession(
  projectId: string,
  sessionId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = finishSessionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };

  const session = await db.sessions.get(sessionId);
  if (!session || session.projectId !== projectId) return { ok: false, error: "会话不存在" };

  const endedAt = now();
  const actualMinutes = Math.max(
    0,
    Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60_000),
  );
  await db.sessions.update(sessionId, {
    endedAt,
    actualMinutes,
    focusRating: parsed.data.focusRating,
    note: parsed.data.note || null,
  });
  notifyDataChanged();
  return { ok: true };
}

export async function discardSession(
  _projectId: string,
  sessionId: string,
): Promise<ActionResult> {
  await db.transaction("rw", [db.sessions, db.interruptions], async () => {
    await db.interruptions.where("sessionId").equals(sessionId).delete();
    await db.sessions.delete(sessionId);
  });
  notifyDataChanged();
  return { ok: true };
}

// ---------- 闪卡与复习 ----------

export async function createCard(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = cardInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await db.cards.add({
    id: uid(),
    projectId,
    topicItemId: parsed.data.topicItemId || null,
    front: parsed.data.front,
    back: parsed.data.back,
    dueAt: now(), // 新卡立即进入今日队列
    intervalDays: 0,
    easeFactor: 2.5,
    reps: 0,
    lapses: 0,
    suspended: false,
  });
  notifyDataChanged();
  return { ok: true };
}

export async function updateCard(
  _projectId: string,
  cardId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = cardInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await db.cards.update(cardId, {
    front: parsed.data.front,
    back: parsed.data.back,
    topicItemId: parsed.data.topicItemId || null,
  });
  notifyDataChanged();
  return { ok: true };
}

export async function setCardSuspended(
  _projectId: string,
  cardId: string,
  suspended: boolean,
): Promise<ActionResult> {
  await db.cards.update(cardId, { suspended });
  notifyDataChanged();
  return { ok: true };
}

export async function deleteCard(
  _projectId: string,
  cardId: string,
): Promise<ActionResult> {
  await db.transaction("rw", [db.cards, db.reviewLogs], async () => {
    await db.reviewLogs.where("cardId").equals(cardId).delete();
    await db.cards.delete(cardId);
  });
  notifyDataChanged();
  return { ok: true };
}

export async function reviewCard(
  projectId: string,
  cardId: string,
  rawGrade: unknown,
): Promise<ActionResult<{ intervalDays: number }>> {
  const grade = gradeSchema.safeParse(rawGrade);
  if (!grade.success) return { ok: false, error: "未知评分" };

  const card = await db.cards.get(cardId);
  if (!card || card.projectId !== projectId) return { ok: false, error: "卡片不存在" };

  const reviewedAt = now();
  const next = schedule(
    {
      intervalDays: card.intervalDays,
      easeFactor: card.easeFactor,
      reps: card.reps,
      lapses: card.lapses,
    },
    grade.data,
    reviewedAt,
  );
  await db.transaction("rw", [db.cards, db.reviewLogs], async () => {
    await db.cards.update(cardId, {
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
      reps: next.reps,
      lapses: next.lapses,
      dueAt: next.dueAt,
    });
    await db.reviewLogs.add({
      id: uid(),
      cardId,
      reviewedAt,
      grade: grade.data,
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
    });
  });
  notifyDataChanged();
  return { ok: true, data: { intervalDays: next.intervalDays } };
}

// ---------- 检索练习 ----------

export async function createRetrievalExercise(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = retrievalExerciseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await db.retrievalExercises.add({
    id: uid(),
    projectId,
    kind: parsed.data.kind,
    title: parsed.data.title,
    prompt: parsed.data.prompt || null,
    content: parsed.data.content || null,
    coverage: parsed.data.coverage,
    createdAt: now(),
  });
  notifyDataChanged();
  return { ok: true };
}

export async function deleteRetrievalExercise(
  _projectId: string,
  exerciseId: string,
): Promise<ActionResult> {
  await db.retrievalExercises.delete(exerciseId);
  notifyDataChanged();
  return { ok: true };
}

// ---------- 直接练习 ----------

export async function createPractice(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = practiceInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await db.directPractices.add({
    id: uid(),
    projectId,
    title: parsed.data.title,
    form: parsed.data.form,
    description: parsed.data.description || null,
    status: "PLANNED",
    startedAt: null,
    completedAt: null,
    createdAt: now(),
  });
  notifyDataChanged();
  return { ok: true };
}

export async function changePracticeStatus(
  projectId: string,
  practiceId: string,
  rawStatus: unknown,
): Promise<ActionResult> {
  const status = practiceStatusSchema.safeParse(
    rawStatus,
  );
  if (!status.success) return { ok: false, error: "未知状态" };
  const practice = await db.directPractices.get(practiceId);
  if (!practice || practice.projectId !== projectId) return { ok: false, error: "练习不存在" };

  const data: Partial<DbPractice> = { status: status.data };
  if (status.data === "IN_PROGRESS" && !practice.startedAt) data.startedAt = now();
  if (status.data === "DONE") data.completedAt = now();
  if (status.data === "PLANNED") data.completedAt = null;
  await db.directPractices.update(practiceId, data);
  notifyDataChanged();
  return { ok: true };
}

export async function deletePractice(
  _projectId: string,
  practiceId: string,
): Promise<ActionResult> {
  // 关联会话/弱点的 practiceId 置空（SetNull 语义）
  await db.transaction("rw", [db.directPractices, db.sessions, db.weakPoints], async () => {
    const sessions = await db.sessions.where("practiceId").equals(practiceId).toArray();
    await Promise.all(sessions.map((s) => db.sessions.update(s.id, { practiceId: null })));
    const wps = await db.weakPoints.where("practiceId").equals(practiceId).toArray();
    await Promise.all(wps.map((w) => db.weakPoints.update(w.id, { practiceId: null })));
    await db.directPractices.delete(practiceId);
  });
  notifyDataChanged();
  return { ok: true };
}

// ---------- 弱点与钻练 ----------

export async function addWeakPoint(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = weakPointInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await db.weakPoints.add({
    id: uid(),
    projectId,
    title: parsed.data.title,
    detail: parsed.data.detail || null,
    source: parsed.data.source,
    practiceId: parsed.data.practiceId || null,
    status: "OPEN",
    createdAt: now(),
  });
  notifyDataChanged();
  return { ok: true };
}

export async function resolveWeakPoint(
  _projectId: string,
  weakPointId: string,
): Promise<ActionResult> {
  await db.weakPoints.update(weakPointId, { status: "RESOLVED" });
  notifyDataChanged();
  return { ok: true };
}

export async function deleteWeakPoint(
  _projectId: string,
  weakPointId: string,
): Promise<ActionResult> {
  await db.transaction("rw", [db.weakPoints, db.drillTasks], async () => {
    await db.drillTasks.where("weakPointId").equals(weakPointId).delete();
    await db.weakPoints.delete(weakPointId);
  });
  notifyDataChanged();
  return { ok: true };
}

export async function createDrillTask(
  projectId: string,
  weakPointId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = drillInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const weakPoint = await db.weakPoints.get(weakPointId);
  if (!weakPoint || weakPoint.projectId !== projectId) return { ok: false, error: "弱点不存在" };

  await db.transaction("rw", [db.drillTasks, db.weakPoints], async () => {
    await db.drillTasks.add({
      id: uid(),
      projectId,
      weakPointId,
      title: parsed.data.title,
      sliceType: parsed.data.sliceType,
      status: "TODO",
      result: null,
      createdAt: now(),
      completedAt: null,
    });
    if (weakPoint.status === "OPEN") {
      await db.weakPoints.update(weakPointId, { status: "DRILLING" });
    }
  });
  notifyDataChanged();
  return { ok: true };
}

export async function changeDrillStatus(
  _projectId: string,
  drillId: string,
  rawStatus: unknown,
): Promise<ActionResult> {
  if (typeof rawStatus !== "string" || !["TODO", "DOING", "AWAIT_VERIFY"].includes(rawStatus)) {
    return { ok: false, error: "未知状态" };
  }
  await db.drillTasks.update(drillId, { status: rawStatus, completedAt: null, result: null });
  notifyDataChanged();
  return { ok: true };
}

export async function verifyDrill(
  projectId: string,
  drillId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = drillVerifySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };

  const drill = await db.drillTasks.get(drillId);
  if (!drill || drill.projectId !== projectId) return { ok: false, error: "钻练任务不存在" };

  await db.transaction("rw", [db.drillTasks, db.weakPoints], async () => {
    await db.drillTasks.update(drillId, {
      status: "DONE",
      result: parsed.data.result || null,
      completedAt: now(),
    });
    const remaining = await db.drillTasks
      .where("weakPointId")
      .equals(drill.weakPointId)
      .filter((d) => ["TODO", "DOING", "AWAIT_VERIFY"].includes(d.status))
      .count();
    if (remaining === 0) {
      await db.weakPoints.update(drill.weakPointId, { status: "RESOLVED" });
    }
  });
  notifyDataChanged();
  return { ok: true };
}

export async function deleteDrill(
  _projectId: string,
  drillId: string,
): Promise<ActionResult> {
  await db.drillTasks.delete(drillId);
  notifyDataChanged();
  return { ok: true };
}

// ---------- 检查清单 ----------

export async function toggleChecklistItem(
  _projectId: string,
  itemId: string,
  isDone: boolean,
): Promise<ActionResult> {
  await db.checklistItems.update(itemId, { isDone });
  notifyDataChanged();
  return { ok: true };
}
