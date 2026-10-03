"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import {
  calcResearchBudget,
  PROJECT_STATUSES,
} from "@/lib/domain";
import { db } from "@/lib/db";
import { PRINCIPLES } from "@/lib/principles";
import {
  projectFieldsSchema,
  wizardSchema,
} from "@/lib/validators/project";

function firstError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "输入不合法";
}

// date input 返回 "YYYY-MM-DD"；转成当天零点的 Date，避免时区偏移
function toDeadline(s: string): Date | null {
  return s ? new Date(`${s}T00:00:00`) : null;
}

export async function createProject(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = wizardSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const input = parsed.data;
  const deadline = toDeadline(input.deadline);
  if (deadline && Number.isNaN(deadline.getTime())) {
    return { ok: false, error: "日期格式不正确" };
  }

  const project = await db.project.create({
    data: {
      name: input.name,
      category: input.category,
      why: input.why || null,
      what: input.what || null,
      how: input.how || null,
      plannedHours: input.plannedHours,
      researchBudget: calcResearchBudget(input.plannedHours),
      deadline,
      topicItems: {
        create: input.topics.map((t, i) => ({
          name: t.name,
          kind: t.kind,
          sortOrder: i,
        })),
      },
      resources: {
        create: input.resources.map((r) => ({
          title: r.title,
          url: r.url || null,
          type: r.type,
          isBenchmark: r.isBenchmark,
        })),
      },
      // 九原则检查清单：按模板一键生成
      checklist: {
        create: PRINCIPLES.flatMap((p) =>
          p.checklist.map((text, i) => ({
            principle: p.order,
            text,
            sortOrder: i,
          })),
        ),
      },
    },
    select: { id: true },
  });

  revalidatePath("/");
  return { ok: true, data: { id: project.id } };
}

export async function updateProject(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = projectFieldsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const input = parsed.data;
  const deadline = toDeadline(input.deadline);
  if (deadline && Number.isNaN(deadline.getTime())) {
    return { ok: false, error: "日期格式不正确" };
  }

  const updated = await db.project.updateMany({
    where: { id: projectId },
    data: {
      name: input.name,
      category: input.category,
      why: input.why || null,
      what: input.what || null,
      how: input.how || null,
      plannedHours: input.plannedHours,
      researchBudget: calcResearchBudget(input.plannedHours),
      deadline,
    },
  });
  if (updated.count === 0) return { ok: false, error: "项目不存在" };

  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function changeProjectStatus(
  projectId: string,
  status: string,
): Promise<ActionResult> {
  if (!(PROJECT_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "未知状态" };
  }
  await db.project.updateMany({
    where: { id: projectId },
    data: { status },
  });
  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  await db.project.deleteMany({ where: { id: projectId } });
  revalidatePath("/");
  return { ok: true };
}
