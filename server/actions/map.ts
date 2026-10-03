"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import {
  idSchema,
  interviewNoteSchema,
  resourceInputSchema,
  topicInputSchema,
  updateTopicItemSchema,
} from "@/lib/validators/map";

function refresh(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/map`);
  revalidatePath("/");
}

// ---------- 主题（概念 / 事实 / 程序） ----------

export async function addTopicItem(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const id = idSchema.safeParse(projectId);
  const parsed = topicInputSchema.safeParse(raw);
  if (!id.success || !parsed.success)
    return { ok: false, error: parsed.success ? "参数不合法" : (parsed.error.issues[0]?.message ?? "输入不合法") };
  const count = await db.topicItem.count({ where: { projectId } });
  await db.topicItem.create({
    data: { projectId, ...parsed.data, sortOrder: count },
  });
  refresh(projectId);
  return { ok: true };
}

export async function updateTopicItem(
  projectId: string,
  itemId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = updateTopicItemSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "输入不合法" };
  await db.topicItem.updateMany({
    where: { id: itemId, projectId },
    data: parsed.data,
  });
  refresh(projectId);
  return { ok: true };
}

export async function deleteTopicItem(
  projectId: string,
  itemId: string,
): Promise<ActionResult> {
  await db.topicItem.deleteMany({ where: { id: itemId, projectId } });
  refresh(projectId);
  return { ok: true };
}

// ---------- 资源 ----------

export async function addResource(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = resourceInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "输入不合法" };
  await db.resource.create({
    data: {
      projectId,
      title: parsed.data.title,
      url: parsed.data.url || null,
      type: parsed.data.type,
      isBenchmark: parsed.data.isBenchmark,
    },
  });
  refresh(projectId);
  return { ok: true };
}

export async function toggleResourceBenchmark(
  projectId: string,
  resourceId: string,
  isBenchmark: boolean,
): Promise<ActionResult> {
  await db.resource.updateMany({
    where: { id: resourceId, projectId },
    data: { isBenchmark },
  });
  refresh(projectId);
  return { ok: true };
}

export async function deleteResource(
  projectId: string,
  resourceId: string,
): Promise<ActionResult> {
  await db.resource.deleteMany({ where: { id: resourceId, projectId } });
  refresh(projectId);
  return { ok: true };
}

// ---------- 专家访谈 ----------

export async function addInterviewNote(
  projectId: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = interviewNoteSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "输入不合法" };
  await db.interviewNote.create({
    data: { projectId, ...parsed.data },
  });
  refresh(projectId);
  return { ok: true };
}

export async function deleteInterviewNote(
  projectId: string,
  noteId: string,
): Promise<ActionResult> {
  await db.interviewNote.deleteMany({ where: { id: noteId, projectId } });
  refresh(projectId);
  return { ok: true };
}
