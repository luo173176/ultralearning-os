import { Link, useParams } from "react-router-dom";
import { Map as MapIcon } from "lucide-react";

import { DirectBoard } from "@/components/direct/direct-board";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/storage/db";
import { useDbQuery } from "@/lib/storage/hooks";

export function DirectPage() {
  const { id = "" } = useParams();
  const { data: bundle, ready } = useDbQuery(
    async () => {
      const [practices, weakPoints] = await Promise.all([
        db.directPractices.where("projectId").equals(id).toArray(),
        db.weakPoints
          .where("projectId")
          .equals(id)
          .filter((w) => w.status !== "RESOLVED" && w.practiceId !== null)
          .toArray(),
      ]);
      const openCountByPractice = new Map<string, number>();
      for (const w of weakPoints) {
        if (w.practiceId) {
          openCountByPractice.set(
            w.practiceId,
            (openCountByPractice.get(w.practiceId) ?? 0) + 1,
          );
        }
      }
      const sessions = await db.sessions.where("projectId").equals(id).toArray();
      return {
        practices: [...practices]
          .sort((a, b) => a.status.localeCompare(b.status) || b.createdAt.getTime() - a.createdAt.getTime())
          .map((p) => ({
            id: p.id,
            title: p.title,
            form: p.form,
            description: p.description,
            status: p.status,
            startedAt: p.startedAt,
            completedAt: p.completedAt,
            sessionsCount: sessions.filter((s) => s.practiceId === p.id).length,
            openWeakPoints: openCountByPractice.get(p.id) ?? 0,
          })),
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
        <h1 className="text-xl font-semibold">直接练习</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          直接练习暴露弱点 → 钻练切片攻克 → 回到这里验证。大部分学习时间应该花在这里。
        </p>
      </header>

      <DirectBoard projectId={id} practices={bundle.practices} />

      <p className="text-center text-xs text-muted-foreground">
        <MapIcon className="mr-1 inline size-3" />
        学习会话页开番茄钟时，可以把会话挂到某个练习上。
      </p>
      <div className="flex justify-center">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link to={`/projects/${id}/focus`}>去学习会话</Link>
        </Button>
      </div>
    </div>
  );
}
