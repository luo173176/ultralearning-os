"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";

export async function toggleChecklistItem(
  projectId: string,
  itemId: string,
  isDone: boolean,
): Promise<ActionResult> {
  if (!projectId || !itemId) return { ok: false, error: "参数不合法" };
  await db.checklistItem.updateMany({
    where: { id: itemId, projectId },
    data: { isDone },
  });
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
