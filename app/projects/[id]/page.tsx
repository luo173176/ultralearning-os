import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Map } from "lucide-react";

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

export const dynamic = "force-dynamic";

export default async function ProjectOverviewPage({
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

  const [topicCount, resourceCount, benchmarkCount] = await Promise.all([
    db.topicItem.count({ where: { projectId: id } }),
    db.resource.count({ where: { projectId: id } }),
    db.resource.count({ where: { projectId: id, isBenchmark: true } }),
  ]);

  const readiness = [
    { label: "Why：为什么学", filled: Boolean(project.why), text: project.why },
    { label: "What：学成什么样", filled: Boolean(project.what), text: project.what },
    { label: "How：怎么学", filled: Boolean(project.how), text: project.how },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${id}/map`}>
            <Map className="size-4" />
            打开学习地图
          </Link>
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
          <CardTitle className="text-base">元学习就绪度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {readiness.map((r) => (
            <div key={r.label} className="flex items-start gap-2">
              {r.filled ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{r.label}</p>
                <p className="text-sm text-muted-foreground">
                  {r.text || "待补充——想清楚再开工，磨刀不误砍柴工。"}
                </p>
              </div>
            </div>
          ))}
          <div className="rounded-lg border bg-accent/40 px-3 py-2 text-sm">
            研究预算{" "}
            <span className="font-medium">{project.researchBudget}</span> 小时
            （计划 {project.plannedHours} 小时 × 10%）· 主题 {topicCount} 个 ·
            资源 {resourceCount} 个（基准 {benchmarkCount} 个）
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
    </div>
  );
}
