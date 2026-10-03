import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProjectNav } from "@/components/project/project-nav";
import { ProjectStatusBadge } from "@/components/project/project-status-badge";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, type Category } from "@/lib/domain";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: project?.name ?? "项目" };
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    select: { id: true, name: true, status: true, category: true },
  });
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link
        href="/"
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
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
