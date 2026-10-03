import { CardsPanel } from "@/components/retrieval/cards-panel";
import { ExercisesPanel } from "@/components/retrieval/exercises-panel";
import { ReviewQueue } from "@/components/retrieval/review-queue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "检索" };

export default async function RetrievalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const now = new Date();
  const [dueCards, allCards, topics, exercises] = await Promise.all([
    db.card.findMany({
      where: { projectId: id, suspended: false, dueAt: { lte: now } },
      orderBy: { dueAt: "asc" },
      take: 50,
      include: { topicItem: { select: { name: true } } },
    }),
    db.card.findMany({
      where: { projectId: id },
      orderBy: [{ suspended: "asc" }, { dueAt: "asc" }],
      include: { topicItem: { select: { name: true } } },
    }),
    db.topicItem.findMany({
      where: { projectId: id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, kind: true },
    }),
    db.retrievalExercise.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const dueCount = dueCards.length;
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dueTomorrowCount = await db.card.count({
    where: {
      projectId: id,
      suspended: false,
      dueAt: { gt: now, lte: tomorrow },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">检索</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          今日到期 {dueCount} 张 · 明天到期 {dueTomorrowCount} 张——用测试代替重读。
        </p>
      </header>

      <Tabs defaultValue="review">
        <TabsList>
          <TabsTrigger value="review">
            今日复习{dueCount > 0 ? `（${dueCount}）` : ""}
          </TabsTrigger>
          <TabsTrigger value="cards">闪卡管理</TabsTrigger>
          <TabsTrigger value="exercises">检索练习</TabsTrigger>
        </TabsList>
        <TabsContent value="review" className="mt-4">
          <ReviewQueue
            projectId={id}
            cards={dueCards.map((c) => ({
              id: c.id,
              front: c.front,
              back: c.back,
              reps: c.reps,
              dueAt: c.dueAt,
              topicName: c.topicItem?.name ?? null,
            }))}
          />
        </TabsContent>
        <TabsContent value="cards" className="mt-4">
          <CardsPanel
            projectId={id}
            cards={allCards.map((c) => ({
              id: c.id,
              front: c.front,
              back: c.back,
              dueAt: c.dueAt,
              intervalDays: c.intervalDays,
              reps: c.reps,
              lapses: c.lapses,
              suspended: c.suspended,
              topicItemId: c.topicItemId,
              topicName: c.topicItem?.name ?? null,
            }))}
            topics={topics}
          />
        </TabsContent>
        <TabsContent value="exercises" className="mt-4">
          <ExercisesPanel projectId={id} exercises={exercises} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
