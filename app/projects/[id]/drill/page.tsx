import { notFound } from "next/navigation";

import { DrillBoard } from "@/components/drill/drill-board";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "弱点与钻练" };

export default async function DrillPage({
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

  const [weakPoints, practices] = await Promise.all([
    db.weakPoint.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      include: {
        drills: { orderBy: { createdAt: "asc" } },
        practice: { select: { title: true } },
      },
    }),
    db.directPractice.findMany({
      where: { projectId: id, status: { not: "DONE" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">弱点与钻练</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          把短板切片隔离、集中火力，练完回到直接练习验证——不要在已经会的地方打转。
        </p>
      </header>

      <DrillBoard
        projectId={id}
        weakPoints={weakPoints.map((wp) => ({
          id: wp.id,
          title: wp.title,
          detail: wp.detail,
          source: wp.source,
          status: wp.status,
          createdAt: wp.createdAt,
          practiceTitle: wp.practice?.title ?? null,
          drills: wp.drills,
        }))}
        practices={practices}
      />
    </div>
  );
}
