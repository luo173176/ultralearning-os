import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileJson, FileText, Map } from "lucide-react";

import { ChecklistPanel } from "@/components/project/checklist-panel";
import { EditProjectDialog } from "@/components/project/edit-project-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import {
  buildDashboard,
  PRINCIPLE_STATUS_META,
  type PrincipleStatus,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_CLASS: Record<PrincipleStatus, string> = {
  NOT_STARTED: "bg-secondary text-secondary-foreground",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600",
  HEALTHY: "bg-emerald-500/10 text-emerald-600",
};

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      checklist: { orderBy: [{ principle: "asc" }, { sortOrder: "asc" }] },
    },
  });
  if (!project) notFound();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [topicCount, benchmarkCount, sessions, practices, weakPoints, drills, cards, recentReviewCount, recentExerciseCount] =
    await Promise.all([
      db.topicItem.count({ where: { projectId: id } }),
      db.resource.count({ where: { projectId: id, isBenchmark: true } }),
      db.session.findMany({
        where: { projectId: id },
        orderBy: { startedAt: "desc" },
        take: 200,
        select: { startedAt: true, _count: { select: { interruptions: true } } },
      }),
      db.directPractice.findMany({ where: { projectId: id }, select: { status: true } }),
      db.weakPoint.findMany({ where: { projectId: id }, select: { status: true } }),
      db.drillTask.findMany({ where: { projectId: id }, select: { status: true } }),
      db.card.findMany({ where: { projectId: id }, select: { reps: true, suspended: true, dueAt: true } }),
      db.reviewLog.count({ where: { card: { projectId: id }, reviewedAt: { gte: weekAgo } } }),
      db.retrievalExercise.count({ where: { projectId: id, createdAt: { gte: weekAgo } } }),
    ]);

  const overdueCardCount = cards.filter(
    (c) => !c.suspended && c.dueAt < startOfToday,
  ).length;

  const dashboard = buildDashboard({
    now,
    project: { why: project.why, what: project.what, how: project.how },
    topicCount,
    benchmarkCount,
    checklist: project.checklist,
    sessions: sessions.map((s) => ({
      startedAt: s.startedAt,
      interruptionCount: s._count.interruptions,
    })),
    practices,
    weakPoints,
    drills,
    cards,
    retrievalRecentCount: recentReviewCount + recentExerciseCount,
    overdueCardCount,
  });
  const healthyCount = dashboard.filter((c) => c.status === "HEALTHY").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${id}/map`}>
            <Map className="size-4" />
            学习地图
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/export?projectId=${id}&format=md`}>
            <FileText className="size-4" />
            导出 Markdown
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/export?projectId=${id}&format=json`}>
            <FileJson className="size-4" />
            导出 JSON
          </a>
        </Button>
        <EditProjectDialog
          project={{
            id: project.id,
            name: project.name,
            category: project.category,
            why: project.why,
            what: project.what,
            how: project.how,
            plannedHours: project.plannedHours,
            deadlineIso: project.deadline
              ? project.deadline.toISOString().slice(0, 10)
              : "",
          }}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>九原则仪表盘</span>
            <span className="text-sm font-normal text-muted-foreground">
              {healthyCount}/9 健康 · 研究预算 {project.researchBudget} 小时
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.map((c) => (
              <div key={c.key} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    #{c.order} {c.zh}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {c.en}
                    </span>
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      STATUS_CLASS[c.status],
                    )}
                  >
                    {PRINCIPLE_STATUS_META[c.status].label}
                  </span>
                </div>
                <p className="mt-2 text-sm">{c.headline}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {c.suggestion}
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>检查清单</span>
                    <span>
                      {c.checklistDone}/{c.checklistTotal}
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width:
                          c.checklistTotal === 0
                            ? "0%"
                            : `${Math.round((c.checklistDone / c.checklistTotal) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">九原则检查清单</CardTitle>
        </CardHeader>
        <CardContent>
          <ChecklistPanel
            projectId={project.id}
            items={project.checklist.map((i) => ({
              id: i.id,
              principle: i.principle,
              text: i.text,
              isDone: i.isDone,
            }))}
          />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        <Download className="mr-1 inline size-3" />
        数据随时可带走：本页可导出 Markdown / JSON，换机或归档都不锁定。
      </p>
    </div>
  );
}
