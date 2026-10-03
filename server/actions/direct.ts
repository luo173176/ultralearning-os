"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import {
  practiceInputSchema,
  practiceStatusSchema,
} from "@/lib/validators/direct";

function firstError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "输入不合法";
}

function refresh(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/direct`);
  revalidatePath(`/projects/${projectId}/focus`);
  revalidatePath("/");
}

export async function createPractice(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = practiceInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await db.directPractice.create({
    data: {
      projectId,
      title: parsed.data.title,
      form: parsed.data.form,
      description: parsed.data.description || null,
    },
  });
  refresh(projectId);
  return { ok: true };
}

export async function changePracticeStatus(
  projectId: string,
  practiceId: string,
  rawStatus: unknown,
): Promise<ActionResult> {
  const status = practiceStatusSchema.safeParse(rawStatus);
  if (!status.success) return { ok: false, error: "未知状态" };

  const practice = await db.directPractice.findFirst({
    where: { id: practiceId, projectId },
    select: { startedAt: true },
  });
  if (!practice) return { ok: false, error: "练习不存在" };

  const data: { status: string; startedAt?: Date | null; completedAt?: Date | null } = {
    status: status.data,
  };
  if (status.data === "IN_PROGRESS" && !practice.startedAt) {
    data.startedAt = new Date();
  }
  if (status.data === "DONE") {
    data.completedAt = new Date();
  }
  if (status.data === "PLANNED") {
    data.completedAt = null;
  }

  await db.directPractice.updateMany({
    where: { id: practiceId, projectId },
    data,
  });
  refresh(projectId);
  return { ok: true };
}

export async function deletePractice(
  projectId: string,
  practiceId: string,
): Promise<ActionResult> {
  // 关联会话/弱点的 practiceId 为可选关系，删除时自动置空（SetNull）
  await db.directPractice.deleteMany({ where: { id: practiceId, projectId } });
  refresh(projectId);
  return { ok: true };
}
