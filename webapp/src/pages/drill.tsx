import { useParams } from "react-router-dom";

import { DrillBoard } from "@/components/drill/drill-board";
import { db } from "@/lib/storage/db";
import { useDbQuery } from "@/lib/storage/hooks";

export function DrillPage() {
  const { id = "" } = useParams();
  const { data: bundle, ready } = useDbQuery(
    async () => {
      const [weakPoints, practices, drillTasks] = await Promise.all([
        db.weakPoints.where("projectId").equals(id).toArray(),
        db.directPractices
          .where("projectId")
          .equals(id)
          .filter((p) => p.status !== "DONE")
          .toArray(),
        db.drillTasks.where("projectId").equals(id).toArray(),
      ]);
      const practiceById = new Map(practices.map((p) => [p.id, p]));
      return {
        weakPoints: weakPoints
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .map((wp) => ({
            id: wp.id,
            title: wp.title,
            detail: wp.detail,
            source: wp.source,
            status: wp.status,
            createdAt: wp.createdAt,
            practiceTitle: wp.practiceId
              ? (practiceById.get(wp.practiceId)?.title ?? null)
              : null,
            drills: drillTasks
              .filter((d) => d.weakPointId === wp.id)
              .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
          })),
        practices: practices.map((p) => ({ id: p.id, title: p.title })),
      };
    },
    [id],
    null,
  );

  if (!ready || !bundle) {
    return <p className="py-16 text-center text-sm text-muted-foreground">加载中…</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">弱点与钻练</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          把短板切片隔离、集中火力，练完回到直接练习验证——不要在已经会的地方打转。
        </p>
      </header>

      <DrillBoard projectId={id} weakPoints={bundle.weakPoints} practices={bundle.practices} />
    </div>
  );
}
