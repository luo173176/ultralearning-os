import { Link, Outlet, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { ProjectNav } from "@/components/project/project-nav";
import { ProjectStatusBadge } from "@/components/project/project-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, type Category } from "@/lib/domain";
import { getProject } from "@/lib/storage";
import { useDbQuery } from "@/lib/storage/hooks";

export function ProjectLayout() {
  const { id = "" } = useParams();
  const { data: project, ready } = useDbQuery(
    async () => {
      const p = await getProject(id);
      return p ?? null;
    },
    [id],
    null,
  );

  if (!ready) {
    return <p className="py-16 text-center text-sm text-muted-foreground">加载中…</p>;
  }
  if (!project) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">项目不存在或已被删除。</p>
        <Button asChild className="mt-4" size="sm">
          <Link to="/">返回项目列表</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        全部项目
      </Link>
      <header className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        <Badge variant="secondary">
          {CATEGORY_LABELS[project.category as Category] ?? project.category}
        </Badge>
        <ProjectStatusBadge status={project.status} />
      </header>
      <div className="mt-8 grid gap-8 md:grid-cols-[180px_1fr]">
        <aside>
          <ProjectNav projectId={project.id} />
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
