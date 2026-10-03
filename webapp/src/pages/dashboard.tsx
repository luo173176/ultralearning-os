import { Link, useParams } from "react-router-dom";
import { FileText, Map } from "lucide-react";

import { ChecklistPanel } from "@/components/project/checklist-panel";
import { EditProjectDialog } from "@/components/project/edit-project-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildDashboard,
  PRINCIPLE_STATUS_META,
  type PrincipleStatus,
} from "@/lib/dashboard";
import { db } from "@/lib/storage/db";
import { useDbQuery } from "@/lib/storage/hooks";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<PrincipleStatus, string> = {
  NOT_STARTED: "bg-secondary text-secondary-foreground",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600",
  HEALTHY: "bg-emerald-500/10 text-emerald-600",
};

export function DashboardPage() {
  const { id = "" } = useParams();
  const { data: bundle, ready } = useDbQuery(
    async () => {
      const project = (await db.projects.get(id)) ?? null;
      const [topicCount, resources, sessions, interruptions, practices, weakPoints, drills, cards, checklist, reviewLogs, exercises] =
        await Promise.all([
          db.topicItems.where("projectId").equals(id).count(),
          db.resources.where("projectId").equals(id).toArray(),
          db.sessions.where("projectId").equals(id).toArray(),
          db.interruptions.toArray(),
          db.directPractices.where("projectId").equals(id).toArray(),
          db.weakPoints.where("projectId").equals(id).toArray(),
          db.drillTasks.where("projectId").equals(id).toArray(),
          db.cards.where("projectId").equals(id).toArray(),
          db.checklistItems.where("projectId").equals(id).toArray(),
          db.reviewLogs.toArray(),
          db.retrievalExercises.where("projectId").equals(id).toArray(),
        ]);
      const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
      const sessionIdSet = new Set(sessions.map((s) => s.id));
      return {
        project,
        topicCount,
        benchmarkCount: resources.filter((r) => r.isBenchmark).length,
        sessions: sessions.map((s) => ({
          startedAt: s.startedAt,
          interruptionCount: interruptions.filter((i) => i.sessionId === s.id).length,
        })),
        practices: practices.map((p) => ({ status: p.status })),
        weakPoints: weakPoints.map((w) => ({ status: w.status })),
        drills: drills.map((d) => ({ status: d.status })),
        cards: cards.map((c) => ({
          reps: c.reps,
          suspended: c.suspended,
          dueAt: c.dueAt,
        })),
        checklist,
        recentReviewCount: reviewLogs.filter(
          (l) => l.reviewedAt.getTime() >= weekAgo,
        ).length,
        recentExerciseCount: exercises.filter(
          (e) => e.createdAt.getTime() >= weekAgo,
        ).length,
        /** 仅用于满足类型：sessionIdSet 未再使用 */
        _sessionIdSet: sessionIdSet.size >= 0,
      };
    },
    [id],
    null,
  );

  if (!ready || !bundle) {
    return <p className="py-16 text-center text-sm text-muted-foreground">加载中…</p>;
  }
  if (!bundle.project) {
    return <p className="py-16 text-center text-sm text-muted-foreground">项目不存在。</p>;
  }

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const overdueCardCount = bundle.cards.filter(
    (c) => !c.suspended && c.dueAt < startOfToday,
  ).length;

  const dashboard = buildDashboard({
    now,
    project: { why: bundle.project.why, what: bundle.project.what, how: bundle.project.how },
    topicCount: bundle.topicCount,
    benchmarkCount: bundle.benchmarkCount,
    checklist: bundle.checklist,
    sessions: bundle.sessions,
    practices: bundle.practices,
    weakPoints: bundle.weakPoints,
    drills: bundle.drills,
    cards: bundle.cards,
    retrievalRecentCount: bundle.recentReviewCount + bundle.recentExerciseCount,
    overdueCardCount,
  });
  const healthyCount = dashboard.filter((c) => c.status === "HEALTHY").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to={`/projects/${id}/map`}>
            <Map className="size-4" />
            学习地图
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={`/projects/${id}/settings`}>
            <FileText className="size-4" />
            数据与导出
          </Link>
        </Button>
        <EditProjectDialog
          project={{
            id: bundle.project.id,
            name: bundle.project.name,
            category: bundle.project.category,
            why: bundle.project.why,
            what: bundle.project.what,
            how: bundle.project.how,
            plannedHours: bundle.project.plannedHours,
            deadlineIso: bundle.project.deadline
              ? bundle.project.deadline.toISOString().slice(0, 10)
              : "",
          }}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>九原则仪表盘</span>
            <span className="text-sm font-normal text-muted-foreground">
              {healthyCount}/9 健康 · 研究预算 {bundle.project.researchBudget} 小时
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
            projectId={id}
            items={bundle.checklist.map((i) => ({
              id: i.id,
              principle: i.principle,
              text: i.text,
              isDone: i.isDone,
            }))}
          />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        数据随时可带走：在「数据与导出」页导出 Markdown / JSON。
      </p>
    </div>
  );
}
