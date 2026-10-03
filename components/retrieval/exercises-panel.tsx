"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { DeleteButton } from "@/components/shared/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  RETRIEVAL_KIND_LABELS,
  RETRIEVAL_KINDS,
  type RetrievalKind,
} from "@/lib/validators/retrieval";
import { formatDate } from "@/lib/utils";
import {
  createRetrievalExercise,
  deleteRetrievalExercise,
} from "@/server/actions/retrieval";

type ExerciseRow = {
  id: string;
  kind: string;
  title: string;
  prompt: string | null;
  content: string | null;
  coverage: number | null;
  createdAt: Date;
};

const KIND_HINTS: Record<RetrievalKind, string> = {
  FREE_RECALL: "合上资料，把还记得的一切默写下来，再对照原文自评覆盖率",
  QUESTION_BOOK: "为主题写下的问题清单，定期合上资料作答",
  CLOSED_BOOK: "不看任何资料完成一次完整任务/输出，检验真实水平",
};

export function ExercisesPanel({
  projectId,
  exercises,
}: {
  projectId: string;
  exercises: ExerciseRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<RetrievalKind>("FREE_RECALL");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState("");
  const [coverage, setCoverage] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add() {
    setError(null);
    startTransition(async () => {
      const res = await createRetrievalExercise(projectId, {
        kind,
        title,
        prompt,
        content,
        coverage: coverage === "" ? null : Number(coverage),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setTitle("");
      setPrompt("");
      setContent("");
      setCoverage("");
      setOpen(false);
      router.refresh();
    });
  }

  const remove = async (id: string) => {
    await deleteRetrievalExercise(projectId, id);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          检索比重读有效得多——回忆越吃力，记得越牢
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              新建检索练习
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>新建检索练习</DialogTitle>
              <DialogDescription>{KIND_HINTS[kind]}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>类型</Label>
                <Select
                  value={kind}
                  onValueChange={(v) => setKind(v as RetrievalKind)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETRIEVAL_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {RETRIEVAL_KIND_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ex-title">标题</Label>
                <Input
                  id="ex-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    kind === "QUESTION_BOOK"
                      ? "如：Pandas 核心问题清单"
                      : "如：第 3 章 自由回忆"
                  }
                />
              </div>
              {kind !== "FREE_RECALL" && (
                <div className="space-y-1.5">
                  <Label htmlFor="ex-prompt">
                    {kind === "QUESTION_BOOK" ? "问题清单" : "挑战说明"}
                  </Label>
                  <Textarea
                    id="ex-prompt"
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      kind === "QUESTION_BOOK"
                        ? "一条一个问题，可多行"
                        : "这次挑战要完成什么？规则是什么？"
                    }
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="ex-content">
                  {kind === "FREE_RECALL"
                    ? "默写内容"
                    : kind === "QUESTION_BOOK"
                      ? "作答记录"
                      : "结果记录"}
                </Label>
                <Textarea
                  id="ex-content"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    kind === "FREE_RECALL"
                      ? "凭记忆写下来……写完再对照资料"
                      : "作答/完成情况"
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ex-coverage">
                  自评覆盖率 0-100（可选，对照资料后填）
                </Label>
                <Input
                  id="ex-coverage"
                  type="number"
                  min={0}
                  max={100}
                  value={coverage}
                  onChange={(e) => setCoverage(e.target.value)}
                  placeholder="如：60"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={add} disabled={pending || !title.trim()}>
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6">
          {exercises.length === 0 && (
            <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
              还没有检索练习——读完一个章节，先做一次自由回忆
            </p>
          )}
          {exercises.map((ex) => (
            <div key={ex.id} className="rounded-lg border px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {RETRIEVAL_KIND_LABELS[ex.kind as RetrievalKind] ?? ex.kind}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {ex.title}
                </span>
                {ex.coverage != null && (
                  <Badge
                    variant="outline"
                    className={
                      ex.coverage >= 80
                        ? "text-emerald-600"
                        : ex.coverage >= 50
                          ? "text-amber-600"
                          : "text-destructive"
                    }
                  >
                    覆盖率 {ex.coverage}%
                  </Badge>
                )}
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {formatDate(ex.createdAt)}
                </span>
                <DeleteButton
                  onConfirm={() => remove(ex.id)}
                  label="删除练习"
                  description={`「${ex.title}」将被删除。`}
                />
              </div>
              {(ex.prompt || ex.content) && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    展开内容
                  </summary>
                  {ex.prompt && (
                    <p className="mt-1.5 whitespace-pre-wrap rounded bg-accent/40 px-3 py-2 text-sm">
                      {ex.prompt}
                    </p>
                  )}
                  {ex.content && (
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">
                      {ex.content}
                    </p>
                  )}
                </details>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
