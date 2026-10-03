"use client";

import { useState, useTransition } from "react";
import { BookOpenCheck, Plus } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { INTERVIEW_QUESTIONS } from "@/lib/templates";
import { formatDate } from "@/lib/utils";
import { addInterviewNote, deleteInterviewNote } from "@/lib/storage";

type InterviewRow = {
  id: string;
  expert: string;
  content: string;
  createdAt: Date;
};

export function InterviewsPanel({
  projectId,
  notes,
}: {
  projectId: string;
  notes: InterviewRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [expert, setExpert] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add() {
    setError(null);
    startTransition(async () => {
      const res = await addInterviewNote(projectId, { expert, content });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setExpert("");
      setContent("");
      setOpen(false);
      
    });
  }

  const remove = async (id: string) => {
    await deleteInterviewNote(projectId, id);
    
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpenCheck className="size-4" />
            访谈问题模板
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            {INTERVIEW_QUESTIONS.map((q) => (
              <li key={q}>{q.replace("{主题}", "这个领域")}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          找 1 位懂行的人聊 20 分钟，胜过自己搜三天
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              记录访谈
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>记录访谈</DialogTitle>
              <DialogDescription>
                按上面的模板问，把回答记在这里。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="itv-expert">受访者</Label>
                <Input
                  id="itv-expert"
                  value={expert}
                  onChange={(e) => setExpert(e.target.value)}
                  placeholder="如：老周（数据工程师）"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itv-content">问答记录</Label>
                <Textarea
                  id="itv-content"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={"问：…\n答：…"}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button
                onClick={add}
                disabled={pending || !expert.trim() || !content.trim()}
              >
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 && (
        <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
          还没有访谈记录
        </p>
      )}
      {notes.map((n) => (
        <Card key={n.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{n.expert}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(n.createdAt)}
                </span>
              </div>
              <DeleteButton
                onConfirm={() => remove(n.id)}
                label="删除访谈"
                description={`与「${n.expert}」的访谈记录将被删除。`}
              />
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{n.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
