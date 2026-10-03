import { NextResponse, type NextRequest } from "next/server";

import { buildProjectMarkdown } from "@/lib/export/markdown";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const format = req.nextUrl.searchParams.get("format") ?? "md";
  if (!projectId) {
    return NextResponse.json({ error: "missing projectId" }, { status: 400 });
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      topicItems: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
      resources: { orderBy: { createdAt: "asc" } },
      interviews: { orderBy: { createdAt: "desc" } },
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 500,
        include: { interruptions: true, practice: { select: { title: true } } },
      },
      practices: { orderBy: { createdAt: "asc" } },
      weakPoints: {
        orderBy: { createdAt: "desc" },
        include: { drills: true, practice: { select: { title: true } } },
      },
      cards: { orderBy: { dueAt: "asc" } },
      exercises: { orderBy: { createdAt: "desc" } },
      checklist: { orderBy: [{ principle: "asc" }, { sortOrder: "asc" }] },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }

  const reviewCount = await db.reviewLog.count({
    where: { card: { projectId } },
  });

  const asciiName = `ultralearning-export-${project.id.slice(-6)}`;

  if (format === "json") {
    const body = JSON.stringify({ ...project, reviewCount }, null, 2);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${asciiName}.json"; filename*=UTF-8''${encodeURIComponent(`${project.name}.json`)}`,
      },
    });
  }

  const markdown = buildProjectMarkdown({ ...project, reviewCount });
  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${asciiName}.md"; filename*=UTF-8''${encodeURIComponent(`${project.name}.md`)}`,
    },
  });
}
