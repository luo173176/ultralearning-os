"use client";

import { useState, useTransition } from "react";
import { EyeOff, Eye, Pencil, Plus } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TOPIC_KIND_LABELS, type TopicKind } from "@/lib/domain";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  createCard,
  deleteCard,
  setCardSuspended,
  updateCard,
} from "@/lib/storage";

type TopicOption = { id: string; name: string; kind: string };

export type CardRow = {
  id: string;
  front: string;
  back: string;
  dueAt: Date;
  intervalDays: number;
  reps: number;
  lapses: number;
  suspended: boolean;
  topicItemId: string | null;
  topicName: string | null;
};

export function CardsPanel({
  projectId,
  cards,
  topics,
}: {
  projectId: string;
  cards: CardRow[];
  topics: TopicOption[];
}) {
  const [pending, startTransition] = useTransition();

  // 新建/编辑共用一个弹窗
  const [editing, setEditing] = useState<CardRow | null>(null);
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [topicItemId, setTopicItemId] = useState<string>("none");
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setFront("");
    setBack("");
    setTopicItemId("none");
    setError(null);
    setOpen(true);
  }

  function openEdit(card: CardRow) {
    setEditing(card);
    setFront(card.front);
    setBack(card.back);
    setTopicItemId(card.topicItemId ?? "none");
    setError(null);
    setOpen(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const payload = { front, back, topicItemId: topicItemId === "none" ? null : topicItemId };
      const res = editing
        ? await updateCard(projectId, editing.id, payload)
        : await createCard(projectId, payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      
    });
  }

  const toggleSuspend = (card: CardRow) =>
    startTransition(async () => {
      await setCardSuspended(projectId, card.id, !card.suspended);
      
    });

  const remove = async (id: string) => {
    await deleteCard(projectId, id);
    
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          新卡建立后立即进入今日复习队列；挂起的卡暂停复习
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              添加卡片
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "编辑卡片" : "添加卡片"}</DialogTitle>
              <DialogDescription>
                正面放问题，背面放答案；一张卡只考一件事。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="card-front">正面（问题）</Label>
                <Textarea
                  id="card-front"
                  rows={2}
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="如：DataFrame 和 Series 的区别是什么？"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-back">背面（答案）</Label>
                <Textarea
                  id="card-back"
                  rows={3}
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="尽量用自己的话，简短、准确"
                />
              </div>
              <div className="space-y-1.5">
                <Label>关联主题（可选）</Label>
                <Select value={topicItemId} onValueChange={setTopicItemId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不关联</SelectItem>
                    {topics.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        [{TOPIC_KIND_LABELS[t.kind as TopicKind] ?? t.kind}]{" "}
                        {t.name}
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
              <Button onClick={save} disabled={pending || !front.trim() || !back.trim()}>
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6">
          {cards.length === 0 && (
            <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
              还没有闪卡——学完一个知识点就把它做成卡
            </p>
          )}
          {cards.map((card) => (
            <div
              key={card.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2",
                card.suspended && "opacity-50",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{card.front}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {card.back}
                </p>
              </div>
              {card.reps === 0 && !card.suspended && <Badge>新</Badge>}
              {card.topicName && (
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {card.topicName}
                </Badge>
              )}
              <span className="hidden w-20 shrink-0 text-right text-xs text-muted-foreground md:block">
                {card.reps > 0
                  ? `${card.intervalDays} 天后`
                  : "待首复习"}
              </span>
              <span className="hidden w-20 shrink-0 text-right text-xs text-muted-foreground md:block">
                到期 {formatDate(card.dueAt)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground"
                aria-label={card.suspended ? "恢复" : "挂起"}
                onClick={() => toggleSuspend(card)}
                disabled={pending}
              >
                {card.suspended ? (
                  <Eye className="size-3.5" />
                ) : (
                  <EyeOff className="size-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground"
                aria-label="编辑"
                onClick={() => openEdit(card)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <DeleteButton
                onConfirm={() => remove(card.id)}
                label="删除卡片"
                description="卡片及其复习记录将被删除。"
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
