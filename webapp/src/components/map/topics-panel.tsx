"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

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
import {
  MASTERY_LABELS,
  MASTERY_LEVELS,
  TOPIC_KIND_LABELS,
  TOPIC_KINDS,
  type TopicKind,
} from "@/lib/domain";
import { addTopicItem, deleteTopicItem, updateTopicItem } from "@/lib/storage";

type Topic = {
  id: string;
  name: string;
  kind: string;
  mastery: number;
  notes: string | null;
};

const KIND_HINTS: Record<TopicKind, string> = {
  CONCEPT: "需要理解，能举例",
  FACT: "需要记住，能回忆",
  PROCEDURE: "需要上手，能做对",
};

export function TopicsPanel({
  projectId,
  topics,
}: {
  projectId: string;
  topics: Topic[];
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<TopicKind>("CONCEPT");
  const [error, setError] = useState<string | null>(null);

  function add() {
    setError(null);
    startTransition(async () => {
      const res = await addTopicItem(projectId, { name, kind });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setName("");
      setKind("CONCEPT");
      setOpen(false);
      
    });
  }

  const setMastery = (id: string, mastery: number) =>
    startTransition(async () => {
      await updateTopicItem(projectId, id, { mastery });
      
    });

  const remove = async (id: string) => {
    await deleteTopicItem(projectId, id);
    
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          掌握度：未学 → 学习中 → 可输出 → 可教别人
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              添加主题
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>添加主题</DialogTitle>
              <DialogDescription>
                概念 = 要理解；事实 = 要记住；程序 = 要会做。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="topic-name">名称</Label>
                <Input
                  id="topic-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：DataFrame 与 Series 的区别"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) add();
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>类型</Label>
                <Select
                  value={kind}
                  onValueChange={(v) => setKind(v as TopicKind)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPIC_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {TOPIC_KIND_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={add} disabled={pending || !name.trim()}>
                添加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {TOPIC_KINDS.map((k) => {
        const list = topics.filter((t) => t.kind === k);
        return (
          <Card key={k}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {TOPIC_KIND_LABELS[k]}
                <Badge variant="secondary">{list.length}</Badge>
                <span className="text-xs font-normal text-muted-foreground">
                  {KIND_HINTS[k]}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {list.length === 0 && (
                <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                  还没有{TOPIC_KIND_LABELS[k]}类主题
                </p>
              )}
              {list.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{t.name}</p>
                    {t.notes && (
                      <p className="truncate text-xs text-muted-foreground">
                        {t.notes}
                      </p>
                    )}
                  </div>
                  <Select
                    value={String(t.mastery)}
                    onValueChange={(v) => setMastery(t.id, Number(v))}
                  >
                    <SelectTrigger className="w-[108px] shrink-0" aria-label="掌握度">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MASTERY_LEVELS.map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {MASTERY_LABELS[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DeleteButton
                    onConfirm={() => remove(t.id)}
                    label="删除主题"
                    description={`「${t.name}」将被删除；已关联此主题的闪卡会保留，只是不再关联。`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
