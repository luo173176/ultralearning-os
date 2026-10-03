import { z } from "zod";

import { PRACTICE_FORMS } from "@/lib/domain";

export const idSchema = z.string().min(1, "参数不合法");

export const practiceInputSchema = z.object({
  title: z.string().min(1, "请填写练习名称").max(200, "太长了"),
  form: z.enum(PRACTICE_FORMS),
  description: z.string().max(2000, "太长了"),
});

export const practiceStatusSchema = z.enum(["PLANNED", "IN_PROGRESS", "DONE"]);
