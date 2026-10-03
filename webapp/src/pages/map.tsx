import { useParams } from "react-router-dom";

import { InterviewsPanel } from "@/components/map/interviews-panel";
import { ResourcesPanel } from "@/components/map/resources-panel";
import { TopicsPanel } from "@/components/map/topics-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/storage/db";
import { useDbQuery } from "@/lib/storage/hooks";

export function MapPage() {
  const { id = "" } = useParams();
  const { data: bundle, ready } = useDbQuery(
    async () => {
      const project = (await db.projects.get(id)) ?? null;
      const [topics, resources, interviews] = await Promise.all([
        db.topicItems.where("projectId").equals(id).sortBy("sortOrder"),
        db.resources.where("projectId").equals(id).sortBy("createdAt"),
        db.interviews.where("projectId").equals(id).reverse().sortBy("createdAt"),
      ]);
      return { project, topics, resources, interviews };
    },
    [id],
    null,
  );

  if (!ready || !bundle) {
    return <p className="py-16 text-center text-sm text-muted-foreground">加载中…</p>;
  }
  if (!bundle.project) {
    return <p className="py-16 text-center text-sm text-muted-foreground">项目不存在。</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">学习地图</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          研究预算 {bundle.project.researchBudget} 小时（计划{" "}
          {bundle.project.plannedHours} 小时的 10%）——画地图、找基准资源、访谈专家都算研究投入。
        </p>
      </header>

      <Tabs defaultValue="topics">
        <TabsList>
          <TabsTrigger value="topics">主题清单</TabsTrigger>
          <TabsTrigger value="resources">资源</TabsTrigger>
          <TabsTrigger value="interviews">专家访谈</TabsTrigger>
        </TabsList>
        <TabsContent value="topics" className="mt-4">
          <TopicsPanel projectId={id} topics={bundle.topics} />
        </TabsContent>
        <TabsContent value="resources" className="mt-4">
          <ResourcesPanel projectId={id} resources={bundle.resources} />
        </TabsContent>
        <TabsContent value="interviews" className="mt-4">
          <InterviewsPanel projectId={id} notes={bundle.interviews} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
