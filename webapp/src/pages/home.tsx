import { Link } from "react-router-dom";
import { FolderKanban, Plus } from "lucide-react";

import { ProjectCard } from "@/components/project/project-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { listProjects } from "@/lib/storage";
import { useDbQuery } from "@/lib/storage/hooks";
import { t } from "@/lib/i18n";

export function HomePage() {
  const { data: projects, ready } = useDbQuery(() => listProjects(), [], []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("home.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("home.subtitle")}</p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="size-4" />
            {t("nav.newProject")}
          </Link>
        </Button>
      </header>

      <section className="mt-8">
        {!ready ? (
          <p className="py-16 text-center text-sm text-muted-foreground">加载中…</p>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={t("home.emptyTitle")}
            description={t("home.emptyDescription")}
            action={
              <Button asChild>
                <Link to="/projects/new">创建第一个项目</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={{
                  id: p.id,
                  name: p.name,
                  why: p.why,
                  status: p.status,
                  category: p.category,
                  deadline: p.deadline,
                  _count: { topicItems: p.topicCount, resources: p.resourceCount },
                }}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="mt-16 text-xs text-muted-foreground">
        {t("home.footer")} · 数据保存在本设备的浏览器中
      </footer>
    </main>
  );
}
