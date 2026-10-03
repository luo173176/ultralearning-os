import { useParams } from "react-router-dom";

import { CardsPanel } from "@/components/retrieval/cards-panel";
import { ExercisesPanel } from "@/components/retrieval/exercises-panel";
import { ReviewQueue } from "@/components/retrieval/review-queue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/storage/db";
import { useDbQuery } from "@/lib/storage/hooks";

export function RetrievalPage() {
  const { id = "" } = useParams();
  const { data: bundle, ready } = useDbQuery(
    async () => {
      const nowDate = new Date();
      const tomorrow = new Date(nowDate.getTime() + 24 * 3600 * 1000);
      const [allCards, topics, exercises] = await Promise.all([
        db.cards.where("projectId").equals(id).toArray(),
        db.topicItems.where("projectId").equals(id).sortBy("sortOrder"),
        db.retrievalExercises.where("projectId").equals(id).reverse().sortBy("createdAt"),
      ]);
      const active = allCards.filter((c) => !c.suspended);
      const dueCards = active
        .filter((c) => c.dueAt <= nowDate)
        .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
        .slice(0, 50);
      const dueTomorrowCount = active.filter(
        (c) => c.dueAt > nowDate && c.dueAt <= tomorrow,
      ).length;
      const topicById = new Map(topics.map((t) => [t.id, t]));
      const withTopic = (topicItemId: string | null) =>
        topicItemId ? (topicById.get(topicItemId)?.name ?? null) : null;

      return {
        dueCount: dueCards.length,
        dueTomorrowCount,
        dueCards: dueCards.map((c) => ({
          id: c.id,
          front: c.front,
          back: c.back,
          reps: c.reps,
          dueAt: c.dueAt,
          topicName: withTopic(c.topicItemId),
        })),
        allCards: [...allCards]
          .sort(
            (a, b) =>
              Number(a.suspended) - Number(b.suspended) ||
              a.dueAt.getTime() - b.dueAt.getTime(),
          )
          .map((c) => ({
            ...c,
            topicName: withTopic(c.topicItemId),
          })),
        topics: topics.map((t) => ({ id: t.id, name: t.name, kind: t.kind })),
        exercises,
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
        <h1 className="text-xl font-semibold">检索</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          今日到期 {bundle.dueCount} 张 · 明天到期 {bundle.dueTomorrowCount}{" "}
          张——用测试代替重读。
        </p>
      </header>

      <Tabs defaultValue="review">
        <TabsList>
          <TabsTrigger value="review">
            今日复习{bundle.dueCount > 0 ? `（${bundle.dueCount}）` : ""}
          </TabsTrigger>
          <TabsTrigger value="cards">闪卡管理</TabsTrigger>
          <TabsTrigger value="exercises">检索练习</TabsTrigger>
        </TabsList>
        <TabsContent value="review" className="mt-4">
          <ReviewQueue projectId={id} cards={bundle.dueCards} />
        </TabsContent>
        <TabsContent value="cards" className="mt-4">
          <CardsPanel projectId={id} cards={bundle.allCards} topics={bundle.topics} />
        </TabsContent>
        <TabsContent value="exercises" className="mt-4">
          <ExercisesPanel projectId={id} exercises={bundle.exercises} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
