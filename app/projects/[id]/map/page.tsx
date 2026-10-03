import { notFound } from "next/navigation";

import { InterviewsPanel } from "@/components/map/interviews-panel";
import { ResourcesPanel } from "@/components/map/resources-panel";
import { TopicsPanel } from "@/components/map/topics-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "学习地图" };

export default async function MapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, topics, resources, interviews] = await Promise.all([
    db.project.findUnique({
      where: { id },
      select: { plannedHours: true, researchBudget: true },
    }),
    db.topicItem.findMany({
      where: { projectId: id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.resource.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "asc" },
    }),
    db.interviewNote.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">学习地图</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          研究预算 {project.researchBudget} 小时（计划 {project.plannedHours}{" "}
          小时的 10%）——画地图、找基准资源、访谈专家都算研究投入。
        </p>
      </header>

      <Tabs defaultValue="topics">
        <TabsList>
          <TabsTrigger value="topics">主题清单</TabsTrigger>
          <TabsTrigger value="resources">资源</TabsTrigger>
          <TabsTrigger value="interviews">专家访谈</TabsTrigger>
        </TabsList>
        <TabsContent value="topics" className="mt-4">
          <TopicsPanel projectId={id} topics={topics} />
        </TabsContent>
        <TabsContent value="resources" className="mt-4">
          <ResourcesPanel projectId={id} resources={resources} />
        </TabsContent>
        <TabsContent value="interviews" className="mt-4">
          <InterviewsPanel projectId={id} notes={interviews} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
