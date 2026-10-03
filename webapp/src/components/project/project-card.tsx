import { Link } from "react-router-dom";
import { CalendarDays, Map } from "lucide-react";

import { ProjectActions } from "@/components/project/project-actions";
import { ProjectStatusBadge } from "@/components/project/project-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CATEGORY_LABELS, type Category } from "@/lib/domain";
import { formatDate } from "@/lib/utils";

type ProjectCardData = {
  id: string;
  name: string;
  why: string | null;
  status: string;
  category: string;
  deadline: Date | null;
  _count: { topicItems: number; resources: number };
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            <Link
              to={`/projects/${project.id}`}
              className="hover:underline"
            >
              {project.name}
            </Link>
          </CardTitle>
          <ProjectActions projectId={project.id} status={project.status} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">
            {CATEGORY_LABELS[project.category as Category] ?? project.category}
          </Badge>
          <ProjectStatusBadge status={project.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.why || "还没有填写 Why——先想清楚为什么学。"}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Map className="size-3.5" />
            主题 {project._count.topicItems} · 资源{" "}
            {project._count.resources}
          </span>
          {project.deadline && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {formatDate(project.deadline)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
