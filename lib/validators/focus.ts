import { z } from "zod";

export const startSessionSchema = z.object({
  plannedMinutes: z
    .number()
    .int()
    .min(1, "至少 1 分钟")
    .max(240, "一次别超过 240 分钟"),
});

export const interruptionInputSchema = z.object({
  reason: z.string().min(1, "请填写原因").max(200, "太长了"),
  seconds: z.number().int().min(0, "不能为负").max(7200, "太长了"),
});

export const finishSessionSchema = z.object({
  focusRating: z.number().int().min(1).max(5).nullable(),
  note: z.string().max(2000, "太长了"),
});
