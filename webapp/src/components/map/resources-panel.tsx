"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Plus, Star } from "lucide-react";

import { DeleteButton } from "@/components/shared/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
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
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPES,
  type ResourceType,
} from "@/lib/domain";
import { cn } from "@/lib/utils";
import {
  addResource,
  deleteResource,
  toggleResourceBenchmark,
} from "@/lib/storage";

type ResourceRow = {
  id: string;
  title: string;
  url: string | null;
  type: string;
  isBenchmark: boolean;
  notes: string | null;
};

export function ResourcesPanel({
  projectId,
  resources,
}: {
  projectId: string;
  resources: ResourceRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<ResourceType>("OTHER");
  const [isBenchmark, setIsBenchmark] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function add() {
    setError(null);
    startTransition(async () => {
      const res = await addResource(projectId, { title, url, type, isBenchmark });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setTitle("");
      setUrl("");
      setType("OTHER");
      setIsBenchmark(false);
      setOpen(false);
      
    });
  }

  const toggleBenchmark = (id: string, v: boolean) =>
    startTransition(async () => {
      await toggleResourceBenchmark(projectId, id, v);
      
    });

  const remove = async (id: string) => {
    await deleteResource(projectId, id);
    
  };

  const sorted = [...resources].sort(
    (a, b) => Number(b.isBenchmark) - Number(a.isBenchmark),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          基准资源 = 用来对照「高手做到什么程度」的标尺（点星标切换）
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              添加资源
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>添加资源</DialogTitle>
              <DialogDescription>
                课程、书籍、导师、社区……以及你的基准资源。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="res-title">名称</Label>
                <Input
                  id="res-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="如：Pandas 官方文档"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-url">链接（可选）</Label>
                <Input
                  id="res-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>类型</Label>
                <Select value={type} onValueChange={(v) => setType(v as ResourceType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((k) => (
                      <SelectItem key={k} value={k}>
                        {RESOURCE_TYPE_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={isBenchmark}
                  onCheckedChange={(v) => setIsBenchmark(v === true)}
                />
                设为基准资源
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={add} disabled={pending || !title.trim()}>
                添加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6">
          {sorted.length === 0 && (
            <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
              还没有资源——先放一个「基准」，知道自己要练到什么程度
            </p>
          )}
          {sorted.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <button
                type="button"
                aria-label={r.isBenchmark ? "取消基准" : "设为基准"}
                onClick={() => toggleBenchmark(r.id, !r.isBenchmark)}
                disabled={pending}
                className="shrink-0"
              >
                <Star
                  className={cn(
                    "size-4",
                    r.isBenchmark
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/50",
                  )}
                />
              </button>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm">
                  {r.url ? (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate hover:underline"
                    >
                      {r.title}
                    </a>
                  ) : (
                    r.title
                  )}
                  {r.url && <ExternalLink className="size-3 shrink-0 text-muted-foreground" />}
                </p>
                {r.notes && (
                  <p className="truncate text-xs text-muted-foreground">{r.notes}</p>
                )}
              </div>
              {r.isBenchmark && <Badge variant="outline">基准</Badge>}
              <Badge variant="secondary">
                {RESOURCE_TYPE_LABELS[r.type as ResourceType] ?? r.type}
              </Badge>
              <DeleteButton
                onConfirm={() => remove(r.id)}
                label="删除资源"
                description={`「${r.title}」将被删除。`}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
