import { z } from "zod";

import { RESOURCE_TYPES, TOPIC_KINDS } from "@/lib/domain";

export const idSchema = z.string().min(1, "参数不合法");

export const topicInputSchema = z.object({
  name: z.string().min(1, "请填写主题名称").max(200, "名称太长了"),
  kind: z.enum(TOPIC_KINDS),
});

export const updateTopicItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  kind: z.enum(TOPIC_KINDS).optional(),
  mastery: z.number().int().min(0).max(3).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const resourceInputSchema = z.object({
  title: z.string().min(1, "请填写资源名称").max(200, "名称太长了"),
  url: z.union([z.string().url("请输入合法链接"), z.literal("")]),
  type: z.enum(RESOURCE_TYPES),
  isBenchmark: z.boolean(),
});

export const interviewNoteSchema = z.object({
  expert: z.string().min(1, "请填写受访者").max(50, "太长了"),
  content: z.string().min(1, "请填写访谈内容").max(5000, "太长了"),
});
