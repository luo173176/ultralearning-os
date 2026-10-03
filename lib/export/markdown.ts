// Markdown 项目报告：人可读的完整归档，可直接粘进笔记软件。
import {
  DRILL_SLICE_LABELS,
  DRILL_STATUS_META,
  MASTERY_LABELS,
  PRACTICE_FORM_LABELS,
  RESOURCE_TYPE_LABELS,
  TOPIC_KIND_LABELS,
  WEAK_POINT_SOURCE_LABELS,
  WEAK_POINT_STATUS_META,
  type DrillSliceType,
  type DrillStatus,
  type ResourceType,
  type WeakPointSource,
  type WeakPointStatus,
} from "@/lib/domain";
import { PRINCIPLES } from "@/lib/principles";
import { formatDate, formatDateTime } from "@/lib/utils";

export type ExportableProject = {
  id: string;
  name: string;
  why: string | null;
  what: string | null;
  how: string | null;
  category: string;
  status: string;
  plannedHours: number;
  researchBudget: number;
  deadline: Date | null;
  createdAt: Date;
  topicItems: { name: string; kind: string; mastery: number; notes: string | null }[];
  resources: { title: string; url: string | null; type: string; isBenchmark: boolean; notes: string | null }[];
  interviews: { expert: string; content: string; createdAt: Date }[];
  sessions: {
    startedAt: Date;
    endedAt: Date | null;
    plannedMinutes: number;
    actualMinutes: number | null;
    focusRating: number | null;
    note: string | null;
    practice: { title: string } | null;
    interruptions: { reason: string; seconds: number }[];
  }[];
  practices: {
    title: string;
    form: string;
    status: string;
    description: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
  }[];
  weakPoints: {
    title: string;
    detail: string | null;
    source: string;
    status: string;
    practice: { title: string } | null;
    drills: {
      title: string;
      sliceType: string;
      status: string;
      result: string | null;
    }[];
  }[];
  cards: {
    front: string;
    back: string;
    intervalDays: number;
    reps: number;
    lapses: number;
    suspended: boolean;
    dueAt: Date;
  }[];
  reviewCount: number;
  exercises: {
    kind: string;
    title: string;
    prompt: string | null;
    content: string | null;
    coverage: number | null;
    createdAt: Date;
  }[];
  checklist: { principle: number; text: string; isDone: boolean }[];
};

const STATUS_ZH: Record<string, string> = {
  ACTIVE: "进行中",
  PAUSED: "已暂停",
  COMPLETED: "已完成",
  ARCHIVED: "已归档",
};

const EXERCISE_KIND_ZH: Record<string, string> = {
  FREE_RECALL: "自由回忆",
  QUESTION_BOOK: "问题书",
  CLOSED_BOOK: "闭卷挑战",
};

export function buildProjectMarkdown(p: ExportableProject): string {
  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push(`# ${p.name} —— 超学习项目报告`);
  push();
  push(`> 导出于 ${formatDateTime(new Date())} · Ultralearning OS · 状态：${STATUS_ZH[p.status] ?? p.status}`);
  push();

  push("## 为什么学（Why）");
  push();
  push(p.why || "（未填写）");
  push();
  push("## 学成什么样（What）");
  push();
  push(p.what || "（未填写）");
  push();
  push("## 怎么学（How）");
  push();
  push(p.how || "（未填写）");
  push();
  push(
    `计划总时长 ${p.plannedHours} 小时 · 研究预算 ${p.researchBudget} 小时（10% 规则）` +
      (p.deadline ? ` · 目标日期 ${formatDate(p.deadline)}` : ""),
  );
  push();

  // 学习地图
  push("## 学习地图");
  push();
  for (const kind of ["CONCEPT", "FACT", "PROCEDURE"] as const) {
    const list = p.topicItems.filter((t) => t.kind === kind);
    push(`### ${TOPIC_KIND_LABELS[kind]}（${list.length}）`);
    push();
    if (list.length === 0) push("（无）");
    for (const t of list) {
      const mastery = MASTERY_LABELS[t.mastery] ?? String(t.mastery);
      push(`- ${t.name}（掌握度：${mastery}）${t.notes ? ` —— ${t.notes}` : ""}`);
    }
    push();
  }
  push("### 资源");
  push();
  if (p.resources.length === 0) push("（无）");
  for (const r of p.resources) {
    const type = RESOURCE_TYPE_LABELS[r.type as ResourceType] ?? r.type;
    const benchmark = r.isBenchmark ? " ⭐基准" : "";
    push(`- ${r.title}（${type}${benchmark}）${r.url ?? ""}${r.notes ? ` —— ${r.notes}` : ""}`);
  }
  push();
  push("### 专家访谈");
  push();
  if (p.interviews.length === 0) push("（无）");
  for (const it of p.interviews) {
    push(`**${it.expert}** · ${formatDate(it.createdAt)}`);
    push();
    push(it.content);
    push();
  }

  // 会话
  push("## 学习会话");
  push();
  const totalMinutes = p.sessions.reduce((n, s) => n + (s.actualMinutes ?? 0), 0);
  const totalInterruptions = p.sessions.reduce((n, s) => n + s.interruptions.length, 0);
  push(`共 ${p.sessions.length} 次会话 · 总计 ${totalMinutes} 分钟 · 分心 ${totalInterruptions} 次`);
  push();
  if (p.sessions.length > 0) {
    push("| 时间 | 计划 | 实际 | 专注 | 分心 | 练习 | 备注 |");
    push("|---|---|---|---|---|---|---|");
    for (const s of [...p.sessions].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())) {
      const rating = s.focusRating != null ? "★".repeat(s.focusRating) : "—";
      const ints = s.interruptions.length > 0 ? s.interruptions.map((i) => `${i.reason}${i.seconds}s`).join("、") : "—";
      push(
        `| ${formatDateTime(s.startedAt)} | ${s.plannedMinutes}min | ${s.actualMinutes ?? "—"}min | ${rating} | ${ints} | ${s.practice?.title ?? "—"} | ${s.note ?? "—"} |`,
      );
    }
    push();
  }

  // 直接练习
  push("## 直接练习");
  push();
  if (p.practices.length === 0) push("（无）");
  for (const pr of p.practices) {
    const form = PRACTICE_FORM_LABELS[pr.form as keyof typeof PRACTICE_FORM_LABELS] ?? pr.form;
    const status = STATUS_ZH[pr.status] ?? pr.status;
    push(
      `- **${pr.title}**（${form} · ${status}）${pr.completedAt ? ` 完成于 ${formatDate(pr.completedAt)}` : ""}`,
    );
    if (pr.description) push(`  - ${pr.description}`);
  }
  push();

  // 弱点与钻练
  push("## 弱点与钻练");
  push();
  if (p.weakPoints.length === 0) push("（无）");
  for (const wp of p.weakPoints) {
    const status = WEAK_POINT_STATUS_META[wp.status as WeakPointStatus]?.label ?? wp.status;
    const source = WEAK_POINT_SOURCE_LABELS[wp.source as WeakPointSource] ?? wp.source;
    push(`### ${wp.title}（${status} · ${source}${wp.practice ? ` · 来自「${wp.practice.title}」` : ""}）`);
    push();
    if (wp.detail) {
      push(wp.detail);
      push();
    }
    if (wp.drills.length === 0) push("（没有钻练任务）");
    for (const d of wp.drills) {
      const slice = DRILL_SLICE_LABELS[d.sliceType as DrillSliceType] ?? d.sliceType;
      const dStatus = DRILL_STATUS_META[d.status as DrillStatus]?.label ?? d.status;
      push(`- 钻练：${d.title}（${slice} · ${dStatus}）${d.result ? ` → 验证结论：${d.result}` : ""}`);
    }
    push();
  }

  // 闪卡与复习
  push("## 闪卡与复习");
  push();
  const dueCount = p.cards.filter((c) => !c.suspended && c.dueAt.getTime() <= Date.now()).length;
  push(`卡片 ${p.cards.length} 张 · 复习 ${p.reviewCount} 次 · 到期中 ${dueCount} 张`);
  push();
  if (p.cards.length > 0) {
    for (const c of p.cards) {
      const suspended = c.suspended ? "（已挂起）" : "";
      push(`- ${c.front} → ${c.back}（间隔 ${c.intervalDays} 天 · 已复习 ${c.reps} 次${c.lapses ? ` · 遗忘 ${c.lapses} 次` : ""}）${suspended}`);
    }
    push();
  }

  // 检索练习
  push("## 检索练习");
  push();
  if (p.exercises.length === 0) push("（无）");
  for (const ex of p.exercises) {
    const kind = EXERCISE_KIND_ZH[ex.kind] ?? ex.kind;
    const coverage = ex.coverage != null ? ` · 覆盖率 ${ex.coverage}%` : "";
    push(`### [${kind}] ${ex.title} · ${formatDate(ex.createdAt)}${coverage}`);
    push();
    if (ex.prompt) {
      push(`> ${ex.prompt}`);
      push();
    }
    if (ex.content) {
      push(ex.content);
      push();
    }
  }

  // 检查清单
  push("## 九原则检查清单");
  push();
  for (const principle of PRINCIPLES) {
    const items = p.checklist.filter((c) => c.principle === principle.order);
    push(`### #${principle.order} ${principle.zh}（${principle.en}）`);
    push();
    for (const item of items) {
      push(`- [${item.isDone ? "x" : " "}] ${item.text}`);
    }
    push();
  }

  push("---");
  push();
  push("本报告由 [Ultralearning OS](https://github.com/luo173176/ultralearning-os) 生成。受《Ultralearning》启发，仅引用原则名称与概念。");

  return lines.join("\n");
}
