import { z } from "zod";

export const RETRIEVAL_KINDS = [
  "FREE_RECALL",
  "QUESTION_BOOK",
  "CLOSED_BOOK",
] as const;
export type RetrievalKind = (typeof RETRIEVAL_KINDS)[number];

export const RETRIEVAL_KIND_LABELS: Record<RetrievalKind, string> = {
  FREE_RECALL: "自由回忆",
  QUESTION_BOOK: "问题书",
  CLOSED_BOOK: "闭卷挑战",
};

export const cardInputSchema = z.object({
  front: z.string().min(1, "请填写卡片正面（问题）").max(2000, "太长了"),
  back: z.string().min(1, "请填写卡片背面（答案）").max(5000, "太长了"),
  topicItemId: z.string().nullable(),
});

export const gradeSchema = z.enum(["AGAIN", "HARD", "GOOD", "EASY"]);

export const retrievalExerciseSchema = z.object({
  kind: z.enum(RETRIEVAL_KINDS),
  title: z.string().min(1, "请填写标题").max(200, "太长了"),
  prompt: z.string().max(5000, "太长了"),
  content: z.string().max(20000, "太长了"),
  coverage: z
    .number()
    .int("请输入整数")
    .min(0, "0-100 之间")
    .max(100, "0-100 之间")
    .nullable(),
});
