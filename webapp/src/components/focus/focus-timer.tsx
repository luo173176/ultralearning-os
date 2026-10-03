"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Coffee,
  Loader2,
  Pause,
  Play,
  Square,
  Star,
  Zap,
} from "lucide-react";

import { useTimerStore } from "@/components/focus/timer-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  elapsedMs,
  formatClock,
  remainingMs,
} from "@/lib/focus";
import { cn, formatDateTime } from "@/lib/utils";
import {
  addInterruption,
  discardSession,
  finishSession,
  startSession,
} from "@/lib/storage";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PRESETS = [5, 15, 25, 50, 90];
const QUICK_REASONS = ["手机", "他人打扰", "杂念走神", "离开座位", "其他"];
const BREAK_MINUTES = 5;

export function FocusTimer({
  projectId,
  practices,
}: {
  projectId: string;
  practices: { id: string; title: string }[];
}) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [selectedPractice, setSelectedPractice] = useState("none");
  const [pending, startTransition] = useTransition();

  const [finishOpen, setFinishOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [intOpen, setIntOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [breakEndsAt, setBreakEndsAt] = useState<number | null>(null);

  const {
    sessionId,
    projectId: activeProjectId,
    practiceId: activePracticeId,
    startedAtMs,
    plannedMinutes,
    status,
    pausedElapsedMs,
    lastResumeAtMs,
    interruptions,
    start,
    pause,
    resume,
    addInterruption: addLocalInterruption,
    clear,
  } = useTimerStore();

  useEffect(() => setMounted(true), []);

  // 运行中每 0.5s 跳一次
  useEffect(() => {
    if (status !== "running") return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [status]);

  // 休息倒计时
  useEffect(() => {
    if (breakEndsAt == null) return;
    const t = setInterval(() => {
      if (Date.now() >= breakEndsAt) {
        setBreakEndsAt(null);
      } else {
        setNow(Date.now());
      }
    }, 500);
    return () => clearInterval(t);
  }, [breakEndsAt]);

  if (!mounted) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          正在恢复计时器…
        </CardContent>
      </Card>
    );
  }

  function begin() {
    startTransition(async () => {
      const res = await startSession(projectId, {
        plannedMinutes: selectedMinutes,
        practiceId: selectedPractice === "none" ? null : selectedPractice,
      });
      if (!res.ok || !res.data) return;
      start({
        sessionId: res.data.sessionId,
        projectId,
        practiceId: selectedPractice === "none" ? null : selectedPractice,
        startedAtMs: Date.parse(res.data.startedAtIso),
        plannedMinutes: selectedMinutes,
      });
      setNow(Date.now());
      
    });
  }

  function finish() {
    startTransition(async () => {
      if (!sessionId) return;
      const res = await finishSession(projectId, sessionId, {
        focusRating: rating,
        note,
      });
      if (!res.ok) return;
      clear();
      setFinishOpen(false);
      setRating(null);
      setNote("");
      setBreakEndsAt(Date.now() + BREAK_MINUTES * 60_000);
      
    });
  }

  function discard() {
    startTransition(async () => {
      if (sessionId) await discardSession(projectId, sessionId);
      clear();
      setDiscardOpen(false);
      
    });
  }

  function logInterruption() {
    startTransition(async () => {
      if (!sessionId) return;
      const res = await addInterruption(projectId, sessionId, { reason, seconds });
      if (!res.ok) return;
      addLocalInterruption({ reason, seconds, atMs: Date.now() });
      setReason("");
      setSeconds(60);
      setIntOpen(false);
    });
  }

  // 其他项目有会话进行中：同一时间只专注一个
  if (sessionId && activeProjectId !== projectId) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            另一个项目有会话进行中——一次只专注一件事。
          </p>
          <Button variant="outline" size="sm" onClick={() => setDiscardOpen(true)}>
            放弃那次会话
          </Button>
          <DiscardDialog
            open={discardOpen}
            onOpenChange={setDiscardOpen}
            pending={pending}
            onCancel={() => setDiscardOpen(false)}
            onConfirm={discard}
          />
        </CardContent>
      </Card>
    );
  }

  const snapshot = {
    status,
    startedAtMs,
    pausedElapsedMs,
    lastResumeAtMs,
    plannedMinutes,
  };
  const elapsed = elapsedMs(snapshot, now);
  const remaining = remainingMs(snapshot, now);
  const isDone = remaining <= 0;

  // 空闲：选择时长并开始
  if (!sessionId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-12">
          <div className="text-6xl font-semibold tabular-nums">
            {formatClock(selectedMinutes * 60_000)}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {PRESETS.map((m) => (
              <Button
                key={m}
                variant={m === selectedMinutes ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMinutes(m)}
              >
                {m} 分钟
              </Button>
            ))}
          </div>
          <Button size="lg" onClick={begin} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            开始专注
          </Button>
          {practices.length > 0 && (
            <div className="flex w-full max-w-sm flex-col gap-1.5">
              <Label htmlFor="focus-practice" className="text-xs text-muted-foreground">
                挂到直接练习（可选）——练什么，记在什么头上
              </Label>
              <Select
                value={selectedPractice}
                onValueChange={setSelectedPractice}
              >
                <SelectTrigger id="focus-practice" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不挂接</SelectItem>
                  {practices.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            进行中可随时记录分心；结束时会请你给专注度打分（可选）。
          </p>
        </CardContent>
      </Card>
    );
  }

  // 进行中 / 暂停
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-5 py-10">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                status === "running"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {status === "running" ? "● 进行中" : "‖ 已暂停"}
            </span>
            {isDone && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-600">
                时间到！休息或继续都行
              </span>
            )}
          </div>

          <div
            className={cn(
              "text-6xl font-semibold tabular-nums",
              isDone && "text-amber-600",
            )}
          >
            {formatClock(remaining)}
          </div>

          <p className="text-sm text-muted-foreground">
            已专注 {Math.floor(elapsed / 60_000)} 分钟 · 开始于{" "}
            {startedAtMs ? formatDateTime(new Date(startedAtMs)) : "—"} · 分心{" "}
            {interruptions.length} 次
            {activePracticeId && (
              <>
                {" "}
                · 练习：{practices.find((p) => p.id === activePracticeId)?.title ?? "已挂接"}
              </>
            )}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {status === "running" ? (
              <Button variant="outline" onClick={() => pause()}>
                <Pause className="size-4" />
                暂停
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  resume();
                  setNow(Date.now());
                }}
              >
                <Play className="size-4" />
                继续
              </Button>
            )}
            <Button variant="outline" onClick={() => setIntOpen(true)}>
              <Zap className="size-4" />
              记录分心
            </Button>
            <Button onClick={() => setFinishOpen(true)}>
              <Square className="size-4" />
              结束会话
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setDiscardOpen(true)}
            >
              放弃
            </Button>
          </div>

          {interruptions.length > 0 && (
            <div className="flex max-w-md flex-wrap justify-center gap-1.5">
              {interruptions.map((i, idx) => (
                <span
                  key={`${i.atMs}-${idx}`}
                  className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  {i.reason} {i.seconds}s
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {breakEndsAt != null && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-between py-4">
            <p className="flex items-center gap-2 text-sm">
              <Coffee className="size-4 text-amber-600" />
              休息一下——离开屏幕，{formatClock((breakEndsAt ?? 0) - now)} 后回来
            </p>
            <Button variant="ghost" size="sm" onClick={() => setBreakEndsAt(null)}>
              跳过休息
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 结束会话 */}
      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>结束会话</DialogTitle>
            <DialogDescription>
              实际 {Math.round(elapsed / 60_000)} 分钟（计划 {plannedMinutes}）·
              分心 {interruptions.length} 次
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>专注度自评（可选）</Label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setRating(rating === n ? null : n)}
                    aria-label={`专注度 ${n}`}
                  >
                    <Star
                      className={cn(
                        "size-4",
                        rating != null && n <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/50",
                      )}
                    />
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="session-note">备注（可选）</Label>
              <Textarea
                id="session-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="这次做了什么？值得记住的进展或问题"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishOpen(false)}>
              返回
            </Button>
            <Button onClick={finish} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              结束并保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 记录分心 */}
      <Dialog open={intOpen} onOpenChange={setIntOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>记录分心</DialogTitle>
            <DialogDescription>
              诚实记录是改善专注的第一步，写完就回来继续。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="int-reason">原因</Label>
              <Input
                id="int-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="什么打断了你？"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="int-seconds">分心耗时（秒）</Label>
              <Input
                id="int-seconds"
                type="number"
                min={0}
                value={seconds}
                onChange={(e) => setSeconds(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntOpen(false)}>
              取消
            </Button>
            <Button
              onClick={logInterruption}
              disabled={pending || !reason.trim() || !Number.isFinite(seconds)}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              记录
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DiscardDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        pending={pending}
        onCancel={() => setDiscardOpen(false)}
        onConfirm={discard}
      />
    </div>
  );
}

function DiscardDialog({
  open,
  onOpenChange,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>放弃本次会话？</AlertDialogTitle>
          <AlertDialogDescription>
            会话与已记录的分心将被删除，不会进入历史。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>取消</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            放弃
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
