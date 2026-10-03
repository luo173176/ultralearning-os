import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle,
  DatabaseBackup,
  Download,
  FileJson,
  FileText,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildProjectMarkdown,
  type ExportableProject,
} from "@/lib/export/markdown";
import { db, wipeAll } from "@/lib/storage/db";
import { useDbQuery } from "@/lib/storage/hooks";

const toDate = (v: unknown) => new Date(v as string);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

function reviveBackup(data: AnyRow) {
  return {
    projects: (data.projects ?? []).map((o: AnyRow) => ({
      ...o,
      deadline: o.deadline ? toDate(o.deadline) : null,
      createdAt: toDate(o.createdAt),
      updatedAt: toDate(o.updatedAt),
    })),
    topicItems: data.topicItems ?? [],
    resources: (data.resources ?? []).map((o: AnyRow) => ({ ...o, createdAt: toDate(o.createdAt) })),
    interviews: (data.interviews ?? []).map((o: AnyRow) => ({ ...o, createdAt: toDate(o.createdAt) })),
    sessions: (data.sessions ?? []).map((o: AnyRow) => ({
      ...o,
      startedAt: toDate(o.startedAt),
      endedAt: o.endedAt ? toDate(o.endedAt) : null,
    })),
    interruptions: (data.interruptions ?? []).map((o: AnyRow) => ({ ...o, at: toDate(o.at) })),
    directPractices: (data.directPractices ?? []).map((o: AnyRow) => ({
      ...o,
      startedAt: o.startedAt ? toDate(o.startedAt) : null,
      completedAt: o.completedAt ? toDate(o.completedAt) : null,
      createdAt: toDate(o.createdAt),
    })),
    weakPoints: (data.weakPoints ?? []).map((o: AnyRow) => ({ ...o, createdAt: toDate(o.createdAt) })),
    drillTasks: (data.drillTasks ?? []).map((o: AnyRow) => ({
      ...o,
      createdAt: toDate(o.createdAt),
      completedAt: o.completedAt ? toDate(o.completedAt) : null,
    })),
    cards: (data.cards ?? []).map((o: AnyRow) => ({ ...o, dueAt: toDate(o.dueAt) })),
    reviewLogs: (data.reviewLogs ?? []).map((o: AnyRow) => ({ ...o, reviewedAt: toDate(o.reviewedAt) })),
    retrievalExercises: (data.retrievalExercises ?? []).map((o: AnyRow) => ({
      ...o,
      createdAt: toDate(o.createdAt),
    })),
    checklistItems: data.checklistItems ?? [],
  };
}

type Backup = ReturnType<typeof reviveBackup>;

async function gatherAll(): Promise<Record<string, unknown[]>> {
  const [
    projects,
    topicItems,
    resources,
    interviews,
    sessions,
    interruptions,
    directPractices,
    weakPoints,
    drillTasks,
    cards,
    reviewLogs,
    retrievalExercises,
    checklistItems,
  ] = await Promise.all([
    db.projects.toArray(),
    db.topicItems.toArray(),
    db.resources.toArray(),
    db.interviews.toArray(),
    db.sessions.toArray(),
    db.interruptions.toArray(),
    db.directPractices.toArray(),
    db.weakPoints.toArray(),
    db.drillTasks.toArray(),
    db.cards.toArray(),
    db.reviewLogs.toArray(),
    db.retrievalExercises.toArray(),
    db.checklistItems.toArray(),
  ]);
  return {
    projects,
    topicItems,
    resources,
    interviews,
    sessions,
    interruptions,
    directPractices,
    weakPoints,
    drillTasks,
    cards,
    reviewLogs,
    retrievalExercises,
    checklistItems,
  };
}

async function restoreBackup(backup: Backup): Promise<number> {
  await wipeAll();
  await db.transaction(
    "rw",
    [
      db.projects,
      db.topicItems,
      db.resources,
      db.interviews,
      db.sessions,
      db.interruptions,
      db.directPractices,
      db.weakPoints,
      db.drillTasks,
      db.cards,
      db.reviewLogs,
      db.retrievalExercises,
      db.checklistItems,
    ],
    async () => {
      await db.projects.bulkAdd(backup.projects);
      await db.topicItems.bulkAdd(backup.topicItems);
      await db.resources.bulkAdd(backup.resources);
      await db.interviews.bulkAdd(backup.interviews);
      await db.sessions.bulkAdd(backup.sessions);
      await db.interruptions.bulkAdd(backup.interruptions);
      await db.directPractices.bulkAdd(backup.directPractices);
      await db.weakPoints.bulkAdd(backup.weakPoints);
      await db.drillTasks.bulkAdd(backup.drillTasks);
      await db.cards.bulkAdd(backup.cards);
      await db.reviewLogs.bulkAdd(backup.reviewLogs);
      await db.retrievalExercises.bulkAdd(backup.retrievalExercises);
      await db.checklistItems.bulkAdd(backup.checklistItems);
    },
  );
  return backup.projects.length;
}

async function loadExportableProject(
  projectId: string,
): Promise<ExportableProject | null> {
  const project = await db.projects.get(projectId);
  if (!project) return null;

  const [topicItems, resources, interviews, sessions, practices, weakPoints, drillTasks, cards, exercises, checklist, allReviewLogs, allInterruptions] =
    await Promise.all([
      db.topicItems.where("projectId").equals(projectId).toArray(),
      db.resources.where("projectId").equals(projectId).toArray(),
      db.interviews.where("projectId").equals(projectId).toArray(),
      db.sessions.where("projectId").equals(projectId).toArray(),
      db.directPractices.where("projectId").equals(projectId).toArray(),
      db.weakPoints.where("projectId").equals(projectId).toArray(),
      db.drillTasks.where("projectId").equals(projectId).toArray(),
      db.cards.where("projectId").equals(projectId).toArray(),
      db.retrievalExercises.where("projectId").equals(projectId).toArray(),
      db.checklistItems.where("projectId").equals(projectId).toArray(),
      db.reviewLogs.toArray(),
      db.interruptions.toArray(),
    ]);

  const sessionIds = new Set(sessions.map((s) => s.id));
  const sessionInterruptions = allInterruptions.filter((i) =>
    sessionIds.has(i.sessionId),
  );
  const projectCardIds = new Set(cards.map((c) => c.id));
  const projectReviewCount = allReviewLogs.filter((l) =>
    projectCardIds.has(l.cardId),
  ).length;

  return {
    ...project,
    topicItems,
    resources,
    interviews,
    sessions: sessions.map((s) => ({
      ...s,
      practice: s.practiceId
        ? practices.find((p) => p.id === s.practiceId)
          ? { title: practices.find((p) => p.id === s.practiceId)!.title }
          : null
        : null,
      interruptions: sessionInterruptions.filter((i) => i.sessionId === s.id),
    })),
    practices,
    weakPoints: weakPoints.map((wp) => ({
      ...wp,
      practice: wp.practiceId
        ? practices.find((p) => p.id === wp.practiceId)
          ? { title: practices.find((p) => p.id === wp.practiceId)!.title }
          : null
        : null,
      drills: drillTasks.filter((x) => x.weakPointId === wp.id),
    })),
    cards,
    reviewCount: projectReviewCount,
    exercises,
    checklist,
  };
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SettingsPage() {
  const { id = "" } = useParams();
  const { data: projects, ready } = useDbQuery(
    () => db.projects.toArray(),
    [],
    [],
  );
  const [selected, setSelected] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [armWipe, setArmWipe] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const projectId = selected || id || projects[0]?.id || "";
  const projectName = projects.find((p) => p.id === projectId)?.name ?? "";

  async function exportMarkdown() {
    if (!projectId) return;
    const data = await loadExportableProject(projectId);
    if (!data) return;
    download(
      `${projectName}.md`,
      buildProjectMarkdown(data),
      "text/markdown;charset=utf-8",
    );
    setMessage(`已导出 Markdown：${projectName}.md`);
  }

  async function exportProjectJson() {
    if (!projectId) return;
    const data = await loadExportableProject(projectId);
    if (!data) return;
    download(
      `${projectName}.json`,
      JSON.stringify(data, null, 2),
      "application/json",
    );
    setMessage(`已导出项目 JSON：${projectName}.json`);
  }

  async function exportFullBackup() {
    const data = await gatherAll();
    const stamp = new Date().toISOString().slice(0, 10);
    download(
      `ultralearning-backup-${stamp}.json`,
      JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2),
      "application/json",
    );
    setMessage("已导出全量备份（含全部项目）。");
  }

  async function importBackup(file: File) {
    setMessage(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { version?: number; data?: AnyRow };
      if (!parsed?.data || Array.isArray(parsed.data)) {
        setMessage("导入失败：这不是本应用的全量备份文件。");
        return;
      }
      const backup = reviveBackup(parsed.data);
      if (backup.projects.length === 0) {
        setMessage("导入失败：备份文件里没有项目。");
        return;
      }
      const count = await restoreBackup(backup);
      setMessage(`导入成功：恢复了 ${count} 个项目的全部数据。`);
    } catch (e) {
      setMessage(`导入失败：${e instanceof Error ? e.message : "文件无法解析"}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function wipeEverything() {
    await wipeAll();
    setArmWipe(false);
    setMessage("已清空本设备的全部数据。");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">数据与导出</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          数据保存在本设备的浏览器里——定期备份，换设备或清浏览器前务必先导出。
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4" />
            导出当前项目
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ready && (
            <Select value={projectId} onValueChange={setSelected}>
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="选择项目" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportMarkdown} disabled={!projectId}>
              <FileText className="size-4" />
              Markdown 报告
            </Button>
            <Button variant="outline" size="sm" onClick={exportProjectJson} disabled={!projectId}>
              <FileJson className="size-4" />
              项目 JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DatabaseBackup className="size-4" />
            全量备份与恢复
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            备份包含本设备上全部项目及其数据；导入会覆盖本设备的现有数据。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={exportFullBackup}>
              <Download className="size-4" />
              导出全量备份
            </Button>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" />
              导入备份
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importBackup(f);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="size-4" />
            危险区
          </CardTitle>
        </CardHeader>
        <CardContent>
          {armWipe ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-destructive">
                确认清空本设备的全部数据？此操作不可恢复！
              </span>
              <Button size="sm" variant="destructive" onClick={wipeEverything}>
                确认清空
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setArmWipe(false)}>
                取消
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="border-destructive/40 text-destructive" onClick={() => setArmWipe(true)}>
              清空本设备数据
            </Button>
          )}
        </CardContent>
      </Card>

      {message && <p className="text-center text-sm">{message}</p>}
    </div>
  );
}
