"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import {
  finishSessionSchema,
  interruptionInputSchema,
  startSessionSchema,
} from "@/lib/validators/focus";

function firstError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "输入不合法";
}

function refresh(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/focus`);
}

export async function startSession(
  projectId: string,
  raw: unknown,
): Promise<ActionResult<{ sessionId: string; startedAtIso: string }>> {
  const parsed = startSessionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  if (!projectId) return { ok: false, error: "参数不合法" };

  const session = await db.session.create({
    data: { projectId, plannedMinutes: parsed.data.plannedMinutes },
    select: { id: true, startedAt: true },
  });
  refresh(projectId);
  return {
    ok: true,
    data: { sessionId: session.id, startedAtIso: session.startedAt.toISOString() },
  };
}

export async function addInterruption(
  projectId: string,
  sessionId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = interruptionInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };

  const session = await db.session.findFirst({
    where: { id: sessionId, projectId },
    select: { id: true },
  });
  if (!session) return { ok: false, error: "会话不存在" };

  await db.interruption.create({
    data: { sessionId, ...parsed.data },
  });
  refresh(projectId);
  return { ok: true };
}

export async function finishSession(
  projectId: string,
  sessionId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = finishSessionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };

  const session = await db.session.findFirst({
    where: { id: sessionId, projectId },
    select: { startedAt: true },
  });
  if (!session) return { ok: false, error: "会话不存在" };

  const endedAt = new Date();
  const actualMinutes = Math.max(
    0,
    Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60_000),
  );
  await db.session.updateMany({
    where: { id: sessionId, projectId },
    data: {
      endedAt,
      actualMinutes,
      focusRating: parsed.data.focusRating,
      note: parsed.data.note || null,
    },
  });
  refresh(projectId);
  return { ok: true };
}

/** 放弃会话：删除该会话及其分心记录（级联），不留"未结束"的脏数据 */
export async function discardSession(
  projectId: string,
  sessionId: string,
): Promise<ActionResult> {
  await db.session.deleteMany({ where: { id: sessionId, projectId } });
  refresh(projectId);
  return { ok: true };
}
