"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { describeInterval } from "@/lib/sm2";
import { reviewCard } from "@/server/actions/retrieval";
import type { Grade } from "@/lib/sm2";

export type DueCard = {
  id: string;
  front: string;
  back: string;
  reps: number;
  dueAt: Date;
  topicName: string | null;
};

const GRADE_BUTTONS: { grade: Grade; label: string; className: string }[] = [
  { grade: "AGAIN", label: "没想起", className: "border-destructive/40 text-destructive hover:bg-destructive/10" },
  { grade: "HARD", label: "有点难", className: "border-amber-500/40 text-amber-600 hover:bg-amber-500/10" },
  { grade: "GOOD", label: "想起来了", className: "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10" },
  { grade: "EASY", label: "很轻松", className: "border-sky-500/40 text-sky-600 hover:bg-sky-500/10" },
];

export function ReviewQueue({
  projectId,
  cards,
}: {
  projectId: string;
  cards: DueCard[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // 本轮已评分张数：评分后刷新会让队列为空，用它区分「本来就没卡」和「复习完了」
  const [gradedCount, setGradedCount] = useState(0);
  // 评分后本地展示的最新间隔（仅提示用）
  const [lastInterval, setLastInterval] = useState<number | null>(null);

  const total = cards.length;
  const current = index < total ? cards[index] : null;

  function grade(g: Grade) {
    if (!current) return;
    setError(null);
    startTransition(async () => {
      const res = await reviewCard(projectId, current.id, g);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setLastInterval(res.data?.intervalDays ?? null);
      setGradedCount((n) => n + 1);
      setFlipped(false);
      const nextIndex = index + 1;
      setIndex(nextIndex);
      if (nextIndex >= total) router.refresh();
    });
  }

  if (total === 0) {
    if (gradedCount > 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <PartyPopper className="size-8 text-emerald-600" />
            <p className="text-sm font-medium">本轮 {gradedCount} 张全部复习完</p>
            {lastInterval != null && (
              <p className="text-sm text-muted-foreground">
                最后一张下次复习：{describeInterval(lastInterval)}
              </p>
            )}
          </CardContent>
        </Card>
      );
    }
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <PartyPopper className="size-8 text-emerald-600" />
          <p className="text-sm font-medium">今日队列已清空</p>
          <p className="text-sm text-muted-foreground">
            没有到期的闪卡。可以做一次自由回忆，或去闪卡管理补几张新卡。
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <PartyPopper className="size-8 text-emerald-600" />
          <p className="text-sm font-medium">本轮 {total} 张全部复习完</p>
          {lastInterval != null && (
            <p className="text-sm text-muted-foreground">
              最后一张下次复习：{describeInterval(lastInterval)}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            第 {index + 1} / {total} 张
          </span>
          <div className="flex items-center gap-1.5">
            {current.reps === 0 && <Badge variant="secondary">新卡</Badge>}
            {current.topicName && (
              <Badge variant="outline">{current.topicName}</Badge>
            )}
          </div>
        </div>

        <div className="min-h-40 rounded-lg border bg-accent/30 px-5 py-6">
          <p className="text-xs text-muted-foreground">
            {flipped ? "答案" : "问题"}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed">
            {flipped ? current.back : current.front}
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!flipped ? (
          <div className="flex justify-center">
            <Button size="lg" onClick={() => setFlipped(true)} disabled={pending}>
              翻面
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            {GRADE_BUTTONS.map((b) => (
              <Button
                key={b.grade}
                variant="outline"
                disabled={pending}
                className={cn(b.className)}
                onClick={() => grade(b.grade)}
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                {b.label}
              </Button>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          这张卡已复习 {current.reps} 次 · 到期时间 {formatDate(current.dueAt)}
        </p>
      </CardContent>
    </Card>
  );
}
