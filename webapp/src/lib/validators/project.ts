import { z } from "zod";

import { CATEGORIES } from "@/lib/domain";
import {
  resourceInputSchema,
  topicInputSchema,
} from "@/lib/validators/map";

// 项目基础字段：创建向导与编辑共用。
// 有意不使用 transform/默认值，保证 zod 的输入类型与输出类型一致，便于 React Hook Form 泛型。
export const projectFieldsSchema = z.object({
  name: z.string().min(1, "请填写项目名称").max(100, "名称太长了"),
  category: z.enum(CATEGORIES),
  why: z.string().max(5000, "太长了"),
  what: z.string().max(5000, "太长了"),
  how: z.string().max(5000, "太长了"),
  plannedHours: z
    .number({ message: "请输入有效数字" })
    .int("请输入整数")
    .min(0, "不能为负数")
    .max(100000, "太夸张了"),
  deadline: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD"),
    z.literal(""),
  ]),
});

export const wizardSchema = projectFieldsSchema.extend({
  topics: z.array(topicInputSchema).max(200, "主题太多了"),
  resources: z.array(resourceInputSchema).max(200, "资源太多了"),
});

export type ProjectFieldsInput = z.infer<typeof projectFieldsSchema>;
export type WizardInput = z.infer<typeof wizardSchema>;
