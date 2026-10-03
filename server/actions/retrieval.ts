"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import { schedule } from "@/lib/sm2";
import {
  cardInputSchema,
  gradeSchema,
  retrievalExerciseSchema,
} from "@/lib/validators/retrieval";

function firstError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "输入不合法";
}

function refresh(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/retrieval`);
  revalidatePath("/");
}

// ---------- 闪卡 ----------

export async function createCard(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = cardInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await db.card.create({
    data: {
      projectId,
      front: parsed.data.front,
      back: parsed.data.back,
      topicItemId: parsed.data.topicItemId || null,
      // dueAt 默认 now：新卡立即进入今日队列，学完就能练
    },
  });
  refresh(projectId);
  return { ok: true };
}

export async function updateCard(
  projectId: string,
  cardId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = cardInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await db.card.updateMany({
    where: { id: cardId, projectId },
    data: {
      front: parsed.data.front,
      back: parsed.data.back,
      topicItemId: parsed.data.topicItemId || null,
    },
  });
  refresh(projectId);
  return { ok: true };
}

export async function setCardSuspended(
  projectId: string,
  cardId: string,
  suspended: boolean,
): Promise<ActionResult> {
  await db.card.updateMany({
    where: { id: cardId, projectId },
    data: { suspended },
  });
  refresh(projectId);
  return { ok: true };
}

export async function deleteCard(
  projectId: string,
  cardId: string,
): Promise<ActionResult> {
  await db.card.deleteMany({ where: { id: cardId, projectId } });
  refresh(projectId);
  return { ok: true };
}

/** 复习评分：SM-2 计算新调度，更新卡片并写复习日志 */
export async function reviewCard(
  projectId: string,
  cardId: string,
  rawGrade: unknown,
): Promise<ActionResult<{ intervalDays: number }>> {
  const grade = gradeSchema.safeParse(rawGrade);
  if (!grade.success) return { ok: false, error: "未知评分" };

  const card = await db.card.findFirst({
    where: { id: cardId, projectId },
    select: {
      intervalDays: true,
      easeFactor: true,
      reps: true,
      lapses: true,
    },
  });
  if (!card) return { ok: false, error: "卡片不存在" };

  const now = new Date();
  const next = schedule(card, grade.data, now);
  await db.card.update({
    where: { id: cardId },
    data: {
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
      reps: next.reps,
      lapses: next.lapses,
      dueAt: next.dueAt,
    },
  });
  await db.reviewLog.create({
    data: {
      cardId,
      grade: grade.data,
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
    },
  });
  refresh(projectId);
  return { ok: true, data: { intervalDays: next.intervalDays } };
}

// ---------- 检索练习（自由回忆 / 问题书 / 闭卷挑战） ----------

export async function createRetrievalExercise(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = retrievalExerciseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await db.retrievalExercise.create({
    data: {
      projectId,
      kind: parsed.data.kind,
      title: parsed.data.title,
      prompt: parsed.data.prompt || null,
      content: parsed.data.content || null,
      coverage: parsed.data.coverage,
    },
  });
  refresh(projectId);
  return { ok: true };
}

export async function deleteRetrievalExercise(
  projectId: string,
  exerciseId: string,
): Promise<ActionResult> {
  await db.retrievalExercise.deleteMany({
    where: { id: exerciseId, projectId },
  });
  refresh(projectId);
  return { ok: true };
}
