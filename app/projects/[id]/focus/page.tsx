import { FocusTimer } from "@/components/focus/focus-timer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { weekStats } from "@/lib/focus";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "学习会话" };

export default async function FocusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessions = await db.session.findMany({
    where: { projectId: id },
    orderBy: { startedAt: "desc" },
    take: 30,
    include: { interruptions: true },
  });
  const stats = weekStats(sessions);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">学习会话</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          番茄钟 + 分心记录——专注质量是可以量化的。
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <FocusTimer projectId={id} />
        <Card className="self-start">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">近 7 天</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <StatRow label="会话数" value={String(stats.count)} />
            <StatRow label="总时长" value={`${stats.totalMinutes} 分钟`} />
            <StatRow label="分心次数" value={String(stats.interruptions)} />
            <StatRow
              label="平均专注自评"
              value={stats.avgFocus != null ? `${stats.avgFocus.toFixed(1)} / 5` : "—"}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">会话历史</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 && (
            <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
              还没有会话——开一个番茄钟试试。
            </p>
          )}
          {sessions.map((s) => (
            <div key={s.id} className="rounded-lg border px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{formatDateTime(s.startedAt)}</span>
                {s.endedAt ? (
                  <Badge variant="secondary">
                    实际 {s.actualMinutes ?? 0} 分钟
                  </Badge>
                ) : (
                  <Badge variant="outline">未结束</Badge>
                )}
                <Badge variant="outline">计划 {s.plannedMinutes} 分钟</Badge>
                {s.interruptions.length > 0 && (
                  <Badge variant="outline">分心 {s.interruptions.length} 次</Badge>
                )}
                {s.focusRating != null && (
                  <span aria-label={`专注度 ${s.focusRating}/5`}>
                    <span className="text-amber-500">
                      {"★".repeat(s.focusRating)}
                    </span>
                    <span className="text-muted-foreground/40">
                      {"★".repeat(5 - s.focusRating)}
                    </span>
                  </span>
                )}
              </div>
              {s.note && (
                <p className="mt-1 text-sm text-muted-foreground">{s.note}</p>
              )}
              {s.interruptions.length > 0 && (
                <p className="mt-1.5 flex flex-wrap gap-1.5">
                  {s.interruptions.map((i) => (
                    <span
                      key={i.id}
                      className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                    >
                      {i.reason} {i.seconds}s
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
