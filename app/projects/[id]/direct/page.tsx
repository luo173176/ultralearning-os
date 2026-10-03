import { notFound } from "next/navigation";

import { DirectBoard } from "@/components/direct/direct-board";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "直接练习" };

export default async function DirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!project) notFound();

  const [practices, openWeakPoints] = await Promise.all([
    db.directPractice.findMany({
      where: { projectId: id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { sessions: true } } },
    }),
    db.weakPoint.groupBy({
      by: ["practiceId"],
      where: { projectId: id, status: { not: "RESOLVED" }, practiceId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const openCountByPractice = new Map(
    openWeakPoints
      .filter((g): g is typeof g & { practiceId: string } => g.practiceId !== null)
      .map((g) => [g.practiceId, g._count._all]),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">直接练习</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          直接练习暴露弱点 → 钻练切片攻克 → 回到这里验证。大部分学习时间应该花在这里。
        </p>
      </header>

      <DirectBoard
        projectId={id}
        practices={practices.map((p) => ({
          id: p.id,
          title: p.title,
          form: p.form,
          description: p.description,
          status: p.status,
          startedAt: p.startedAt,
          completedAt: p.completedAt,
          sessionsCount: p._count.sessions,
          openWeakPoints: openCountByPractice.get(p.id) ?? 0,
        }))}
      />
    </div>
  );
}
