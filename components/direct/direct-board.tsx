"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bug, Loader2, Plus } from "lucide-react";

import { DeleteButton } from "@/components/shared/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PRACTICE_FORM_LABELS,
  PRACTICE_FORMS,
  PRACTICE_STATUS_META,
  type PracticeStatus,
} from "@/lib/domain";
import { cn, formatDate } from "@/lib/utils";
import { addWeakPoint } from "@/server/actions/drill";
import {
  changePracticeStatus,
  createPractice,
  deletePractice,
} from "@/server/actions/direct";

export type PracticeRow = {
  id: string;
  title: string;
  form: string;
  description: string | null;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  sessionsCount: number;
  openWeakPoints: number;
};

export function DirectBoard({
  projectId,
  practices,
}: {
  projectId: string;
  practices: PracticeRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("ALL");

  // 新建练习
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [form, setForm] = useState<string>("PROJECT");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 从练习转弱点
  const [wpPractice, setWpPractice] = useState<PracticeRow | null>(null);
  const [wpTitle, setWpTitle] = useState("");
  const [wpDetail, setWpDetail] = useState("");

  function addPractice() {
    setError(null);
    startTransition(async () => {
      const res = await createPractice(projectId, { title, form, description });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setTitle("");
      setDescription("");
      setAddOpen(false);
      router.refresh();
    });
  }

  function toWeakPoint() {
    if (!wpPractice) return;
    setError(null);
    startTransition(async () => {
      const res = await addWeakPoint(projectId, {
        title: wpTitle,
        detail: wpDetail,
        source: "PRACTICE",
        practiceId: wpPractice.id,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setWpPractice(null);
      setWpTitle("");
      setWpDetail("");
      router.refresh();
    });
  }

  const setStatus = (id: string, s: string) =>
    startTransition(async () => {
      await changePracticeStatus(projectId, id, s);
      router.refresh();
    });

  const remove = async (id: string) => {
    await deletePractice(projectId, id);
    router.refresh();
  };

  const filtered =
    filter === "ALL" ? practices : practices.filter((p) => p.form === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {["ALL", ...PRACTICE_FORMS].map((f) => {
            const count =
              f === "ALL"
                ? practices.length
                : practices.filter((p) => p.form === f).length;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  filter === f
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {f === "ALL" ? "全部" : PRACTICE_FORM_LABELS[f as keyof typeof PRACTICE_FORM_LABELS]}
                （{count}）
              </button>
            );
          })}
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              新建练习
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>新建直接练习</DialogTitle>
              <DialogDescription>
                项目式=做一个真实作品；沉浸=泡在真实环境；模拟=仿真场景练习；Overkill=故意上超纲难度。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pr-title">名称</Label>
                <Input
                  id="pr-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="如：每周用真实数据产出一份分析报告"
                />
              </div>
              <div className="space-y-1.5">
                <Label>形态</Label>
                <Select value={form} onValueChange={setForm}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRACTICE_FORMS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {PRACTICE_FORM_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pr-desc">说明（可选）</Label>
                <Textarea
                  id="pr-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="练习内容、节奏、验收标准"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                取消
              </Button>
              <Button onClick={addPractice} disabled={pending || !title.trim()}>
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 && (
        <p className="rounded-lg border border-dashed px-3 py-10 text-center text-sm text-muted-foreground">
          还没有直接练习——输入只会让你产生「学会了」的错觉，真实场景的输出才是学习本身
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((p) => {
          const statusMeta =
            PRACTICE_STATUS_META[p.status as PracticeStatus] ?? {
              label: p.status,
              badge: "outline" as const,
            };
          return (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">
                    {p.title}
                  </CardTitle>
                  <DeleteButton
                    onConfirm={() => remove(p.id)}
                    label="删除练习"
                    description={`「${p.title}」将被删除；已关联的会话与弱点会保留（不再关联）。`}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">
                    {PRACTICE_FORM_LABELS[p.form as keyof typeof PRACTICE_FORM_LABELS] ??
                      p.form}
                  </Badge>
                  <Badge variant={statusMeta.badge}>{statusMeta.label}</Badge>
                  {p.openWeakPoints > 0 && (
                    <Link href={`/projects/${projectId}/drill`}>
                      <Badge
                        variant="destructive"
                        className="cursor-pointer hover:opacity-80"
                      >
                        <Bug className="size-3" />
                        弱点 {p.openWeakPoints} 待攻克
                      </Badge>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.description && (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {p.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  会话 {p.sessionsCount} 次
                  {p.startedAt && ` · 开始于 ${formatDate(p.startedAt)}`}
                  {p.completedAt && ` · 完成于 ${formatDate(p.completedAt)}`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.status === "PLANNED" && (
                    <Button
                      size="sm"
                      onClick={() => setStatus(p.id, "IN_PROGRESS")}
                      disabled={pending}
                    >
                      开始练习
                    </Button>
                  )}
                  {p.status === "IN_PROGRESS" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStatus(p.id, "DONE")}
                      disabled={pending}
                    >
                      标记完成
                    </Button>
                  )}
                  {p.status === "DONE" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setStatus(p.id, "IN_PROGRESS")}
                      disabled={pending}
                    >
                      重新打开
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-amber-600 hover:text-amber-600"
                    onClick={() => {
                      setWpPractice(p);
                      setWpTitle("");
                      setWpDetail("");
                    }}
                  >
                    <Bug className="size-4" />
                    发现弱点
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 从练习转弱点（Direct-Then-Drill 的起点） */}
      <Dialog
        open={wpPractice != null}
        onOpenChange={(v) => !v && setWpPractice(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>发现弱点</DialogTitle>
            <DialogDescription>
              来自「{wpPractice?.title ?? ""}」——记下它，钻练会从这里接管。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wp-title">弱点</Label>
              <Input
                id="wp-title"
                value={wpTitle}
                onChange={(e) => setWpTitle(e.target.value)}
                placeholder="如：多表 join 时总写错顺序"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wp-detail">细节（可选）</Label>
              <Textarea
                id="wp-detail"
                rows={3}
                value={wpDetail}
                onChange={(e) => setWpDetail(e.target.value)}
                placeholder="具体在哪种情况下出错？"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWpPractice(null)}>
              取消
            </Button>
            <Button
              onClick={toWeakPoint}
              disabled={pending || !wpTitle.trim()}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              记下弱点，去钻练
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {practices.some((p) => p.openWeakPoints > 0) && (
        <p className="text-center text-xs text-muted-foreground">
          有弱点待攻克——
          <Link
            href={`/projects/${projectId}/drill`}
            className="underline hover:text-foreground"
          >
            去钻练
          </Link>
          ，攻克后回到这里验证。
        </p>
      )}
    </div>
  );
}
