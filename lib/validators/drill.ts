import { z } from "zod";

import {
  DRILL_SLICE_TYPES,
  WEAK_POINT_SOURCES,
} from "@/lib/domain";

export const idSchema = z.string().min(1, "参数不合法");

export const weakPointInputSchema = z.object({
  title: z.string().min(1, "请填写弱点描述").max(200, "太长了"),
  detail: z.string().max(2000, "太长了"),
  source: z.enum(WEAK_POINT_SOURCES),
  practiceId: z.string().nullable(),
});

export const drillInputSchema = z.object({
  title: z.string().min(1, "请填写钻练任务").max(200, "太长了"),
  sliceType: z.enum(DRILL_SLICE_TYPES),
});

export const drillVerifySchema = z.object({
  result: z.string().max(2000, "太长了"),
});
