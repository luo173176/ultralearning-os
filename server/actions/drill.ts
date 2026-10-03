"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import {
  drillInputSchema,
  drillVerifySchema,
  idSchema,
  weakPointInputSchema,
} from "@/lib/validators/drill";

function firstError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "输入不合法";
}

function refresh(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/drill`);
  revalidatePath(`/projects/${projectId}/direct`);
  revalidatePath("/");
}

// ---------- 弱点 ----------

export async function addWeakPoint(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = weakPointInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await db.weakPoint.create({
    data: {
      projectId,
      title: parsed.data.title,
      detail: parsed.data.detail || null,
      source: parsed.data.source,
      practiceId: parsed.data.practiceId || null,
    },
  });
  refresh(projectId);
  return { ok: true };
}

export async function resolveWeakPoint(
  projectId: string,
  weakPointId: string,
): Promise<ActionResult> {
  await db.weakPoint.updateMany({
    where: { id: weakPointId, projectId },
    data: { status: "RESOLVED" },
  });
  refresh(projectId);
  return { ok: true };
}

export async function deleteWeakPoint(
  projectId: string,
  weakPointId: string,
): Promise<ActionResult> {
  await db.weakPoint.deleteMany({ where: { id: weakPointId, projectId } });
  refresh(projectId);
  return { ok: true };
}

// ---------- 钻练任务 ----------

export async function createDrillTask(
  projectId: string,
  weakPointId: string,
  raw: unknown,
): Promise<ActionResult> {
  const id = idSchema.safeParse(weakPointId);
  const parsed = drillInputSchema.safeParse(raw);
  if (!id.success || !parsed.success)
    return { ok: false, error: parsed.success ? "参数不合法" : firstError(parsed.error.issues) };

  const weakPoint = await db.weakPoint.findFirst({
    where: { id: weakPointId, projectId },
    select: { id: true },
  });
  if (!weakPoint) return { ok: false, error: "弱点不存在" };

  await db.$transaction([
    db.drillTask.create({
      data: {
        projectId,
        weakPointId,
        title: parsed.data.title,
        sliceType: parsed.data.sliceType,
      },
    }),
    // Direct-Then-Drill：一旦开始钻练，弱点进入"钻练中"
    db.weakPoint.updateMany({
      where: { id: weakPointId, status: "OPEN" },
      data: { status: "DRILLING" },
    }),
  ]);
  refresh(projectId);
  return { ok: true };
}

/** 钻练状态流转：TODO→DOING→AWAIT_VERIFY（验证走 verifyDrill） */
export async function changeDrillStatus(
  projectId: string,
  drillId: string,
  rawStatus: unknown,
): Promise<ActionResult> {
  if (
    !["TODO", "DOING", "AWAIT_VERIFY"].includes(rawStatus as string) ||
    typeof rawStatus !== "string"
  ) {
    return { ok: false, error: "未知状态" };
  }
  const drill = await db.drillTask.findFirst({
    where: { id: drillId, projectId },
    select: { weakPointId: true },
  });
  if (!drill) return { ok: false, error: "钻练任务不存在" };

  await db.drillTask.updateMany({
    where: { id: drillId, projectId },
    data: { status: rawStatus, completedAt: null, result: null },
  });
  refresh(projectId);
  return { ok: true };
}

/**
 * 验证通过：钻练 DONE 并回填验证结论；
 * 若该弱点下没有其他未完成钻练，弱点自动 RESOLVED——闭环收口。
 */
export async function verifyDrill(
  projectId: string,
  drillId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = drillVerifySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };

  const drill = await db.drillTask.findFirst({
    where: { id: drillId, projectId },
    select: { weakPointId: true },
  });
  if (!drill) return { ok: false, error: "钻练任务不存在" };

  await db.drillTask.updateMany({
    where: { id: drillId, projectId },
    data: {
      status: "DONE",
      result: parsed.data.result || null,
      completedAt: new Date(),
    },
  });

  const remaining = await db.drillTask.count({
    where: {
      weakPointId: drill.weakPointId,
      status: { in: ["TODO", "DOING", "AWAIT_VERIFY"] },
    },
  });
  if (remaining === 0) {
    await db.weakPoint.updateMany({
      where: { id: drill.weakPointId },
      data: { status: "RESOLVED" },
    });
  }
  refresh(projectId);
  return { ok: true };
}

export async function deleteDrill(
  projectId: string,
  drillId: string,
): Promise<ActionResult> {
  await db.drillTask.deleteMany({ where: { id: drillId, projectId } });
  refresh(projectId);
  return { ok: true };
}
