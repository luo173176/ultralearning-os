"use client";

import { Link } from "react-router-dom";
import { useState, useTransition } from "react";
import { ArrowRight, Bug, Loader2, Plus, RotateCcw } from "lucide-react";

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
  DRILL_SLICE_LABELS,
  DRILL_SLICE_TYPES,
  DRILL_STATUS_META,
  WEAK_POINT_SOURCE_LABELS,
  WEAK_POINT_STATUS_META,
  type DrillSliceType,
  type DrillStatus,
  type WeakPointSource,
  type WeakPointStatus,
} from "@/lib/domain";
import { cn } from "@/lib/utils";
import {
  addWeakPoint,
  createDrillTask,
  changeDrillStatus,
  deleteDrill,
  deleteWeakPoint,
  resolveWeakPoint,
  verifyDrill,
} from "@/lib/storage";

export type DrillRow = {
  id: string;
  title: string;
  sliceType: string;
  status: string;
  result: string | null;
  createdAt: Date;
};

export type WeakPointWithDrills = {
  id: string;
  title: string;
  detail: string | null;
  source: string;
  status: string;
  createdAt: Date;
  practiceTitle: string | null;
  drills: DrillRow[];
};

const SLICE_HINTS: Record<DrillSliceType, string> = {
  TIME_SLICE: "只练其中一段（如演讲只练开场 30 秒）",
  COGNITIVE_SLICE: "只练一个认知子技能（如只练听辨不含说）",
  COPYCAT: "对着高手的示范逐段复制模仿",
  MAGNIFIER: "放大镜——放慢放大，逐帧抠细节",
  PREREQUISITE: "回补缺失的前提知识/技能",
};

const STATUS_ORDER: Record<string, number> = {
  DRILLING: 0,
  OPEN: 1,
  RESOLVED: 2,
};

export function DrillBoard({
  projectId,
  weakPoints,
  practices,
}: {
  projectId: string;
  weakPoints: WeakPointWithDrills[];
  practices: { id: string; title: string }[];
}) {
  const [pending, startTransition] = useTransition();

  // 新建弱点
  const [wpOpen, setWpOpen] = useState(false);
  const [wpTitle, setWpTitle] = useState("");
  const [wpDetail, setWpDetail] = useState("");
  const [wpSource, setWpSource] = useState<WeakPointSource>("SELF");
  const [wpPracticeId, setWpPracticeId] = useState("none");
  const [error, setError] = useState<string | null>(null);

  // 新建钻练
  const [drillFor, setDrillFor] = useState<WeakPointWithDrills | null>(null);
  const [drillTitle, setDrillTitle] = useState("");
  const [sliceType, setSliceType] = useState<DrillSliceType>("COGNITIVE_SLICE");

  // 验证
  const [verifyFor, setVerifyFor] = useState<DrillRow | null>(null);
  const [verifyResult, setVerifyResult] = useState("");

  function addWeakPointSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await addWeakPoint(projectId, {
        title: wpTitle,
        detail: wpDetail,
        source: wpSource,
        practiceId: wpPracticeId === "none" ? null : wpPracticeId,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setWpTitle("");
      setWpDetail("");
      setWpOpen(false);
      
    });
  }

  function addDrillSubmit() {
    if (!drillFor) return;
    startTransition(async () => {
      const res = await createDrillTask(projectId, drillFor.id, {
        title: drillTitle,
        sliceType,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDrillTitle("");
      setDrillFor(null);
      
    });
  }

  function verifySubmit() {
    if (!verifyFor) return;
    startTransition(async () => {
      const res = await verifyDrill(projectId, verifyFor.id, {
        result: verifyResult,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setVerifyFor(null);
      setVerifyResult("");
      
    });
  }

  const setStatus = (id: string, s: string) =>
    startTransition(async () => {
      await changeDrillStatus(projectId, id, s);
      
    });

  const resolve = async (id: string) => {
    await resolveWeakPoint(projectId, id);
    
  };

  const removeWp = async (id: string) => {
    await deleteWeakPoint(projectId, id);
    
  };

  const removeDrill = async (id: string) => {
    await deleteDrill(projectId, id);
    
  };

  const sorted = [...weakPoints].sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const awaiting = weakPoints.filter((wp) =>
    wp.drills.some((d) => d.status === "AWAIT_VERIFY"),
  );
  const resolvedCount = weakPoints.filter((wp) => wp.status === "RESOLVED").length;

  return (
    <div className="space-y-4">
      {awaiting.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4">
            <p className="text-sm text-amber-700 dark:text-amber-500">
              有 {awaiting.length} 个弱点的钻练已完成——回到直接练习检验效果，验证通过才算真掌握。
            </p>
            <Button asChild size="sm" variant="outline">
              <Link to={`/projects/${projectId}/direct`}>
                去直接练习验证
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          未攻克 {weakPoints.length - resolvedCount} · 已解决 {resolvedCount}——弱点不可怕，跳过它才可怕
        </p>
        <Dialog open={wpOpen} onOpenChange={setWpOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Bug className="size-4" />
              登记弱点
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>登记弱点</DialogTitle>
              <DialogDescription>
                从练习、反馈或检索错误里暴露出来的短板，越具体越好。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nwp-title">弱点</Label>
                <Input
                  id="nwp-title"
                  value={wpTitle}
                  onChange={(e) => setWpTitle(e.target.value)}
                  placeholder="如：异步错误的堆栈看不懂"
                />
              </div>
              <div className="space-y-1.5">
                <Label>来源</Label>
                <Select
                  value={wpSource}
                  onValueChange={(v) => setWpSource(v as WeakPointSource)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(WEAK_POINT_SOURCE_LABELS) as WeakPointSource[]).map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {WEAK_POINT_SOURCE_LABELS[s]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>关联练习（可选）</Label>
                <Select value={wpPracticeId} onValueChange={setWpPracticeId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不关联</SelectItem>
                    {practices.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nwp-detail">细节（可选）</Label>
                <Textarea
                  id="nwp-detail"
                  rows={2}
                  value={wpDetail}
                  onChange={(e) => setWpDetail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWpOpen(false)}>
                取消
              </Button>
              <Button onClick={addWeakPointSubmit} disabled={pending || !wpTitle.trim()}>
                登记并开始钻练
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sorted.length === 0 && (
        <p className="rounded-lg border border-dashed px-3 py-10 text-center text-sm text-muted-foreground">
          还没有弱点记录——在直接练习里「发现弱点」，或在这里手动登记
        </p>
      )}

      {sorted.map((wp) => {
        const statusMeta =
          WEAK_POINT_STATUS_META[wp.status as WeakPointStatus] ?? {
            label: wp.status,
            badge: "outline" as const,
          };
        return (
          <Card key={wp.id} className={cn(wp.status === "RESOLVED" && "opacity-60")}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-base leading-snug">
                    {wp.title}
                  </CardTitle>
                  {wp.detail && (
                    <p className="mt-1 text-sm text-muted-foreground">{wp.detail}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={statusMeta.badge}>{statusMeta.label}</Badge>
                    <Badge variant="outline">
                      {WEAK_POINT_SOURCE_LABELS[wp.source as WeakPointSource] ??
                        wp.source}
                    </Badge>
                    {wp.practiceTitle && (
                      <Badge variant="outline">来自：{wp.practiceTitle}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {wp.status !== "RESOLVED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => resolve(wp.id)}
                      disabled={pending}
                    >
                      标记已解决
                    </Button>
                  )}
                  <DeleteButton
                    onConfirm={() => removeWp(wp.id)}
                    label="删除弱点"
                    description={`「${wp.title}」及其全部钻练任务将被删除。`}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {wp.drills.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  还没有钻练任务——把弱点切成可集中火力的小任务
                </p>
              )}
              {wp.drills.map((d) => {
                const dMeta =
                  DRILL_STATUS_META[d.status as DrillStatus] ?? {
                    label: d.status,
                    badge: "outline" as const,
                  };
                return (
                  <div
                    key={d.id}
                    className="rounded-lg border px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {DRILL_SLICE_LABELS[d.sliceType as DrillSliceType] ??
                          d.sliceType}
                      </Badge>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {d.title}
                      </span>
                      <Badge variant={dMeta.badge}>{dMeta.label}</Badge>
                      <div className="flex items-center gap-1">
                        {d.status === "TODO" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatus(d.id, "DOING")}
                            disabled={pending}
                          >
                            开始
                          </Button>
                        )}
                        {d.status === "DOING" && (
                          <Button
                            size="sm"
                            onClick={() => setStatus(d.id, "AWAIT_VERIFY")}
                            disabled={pending}
                          >
                            练完了，待验证
                          </Button>
                        )}
                        {d.status === "AWAIT_VERIFY" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setVerifyFor(d);
                                setVerifyResult("");
                              }}
                            >
                              验证通过
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setStatus(d.id, "DOING")}
                              disabled={pending}
                            >
                              <RotateCcw className="size-4" />
                              退回重练
                            </Button>
                          </>
                        )}
                        {d.status !== "DONE" && (
                          <DeleteButton
                            onConfirm={() => removeDrill(d.id)}
                            label="删除任务"
                            description={`「${d.title}」将被删除。`}
                          />
                        )}
                      </div>
                    </div>
                    {d.status === "DONE" && d.result && (
                      <p className="mt-1.5 whitespace-pre-wrap rounded bg-emerald-500/5 px-2.5 py-1.5 text-xs text-muted-foreground">
                        验证结论：{d.result}
                      </p>
                    )}
                  </div>
                );
              })}
              {wp.status !== "RESOLVED" && (
                <Dialog
                  open={drillFor?.id === wp.id}
                  onOpenChange={(v) => !v && setDrillFor(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDrillFor(wp);
                        setDrillTitle("");
                        setSliceType("COGNITIVE_SLICE");
                      }}
                    >
                      <Plus className="size-4" />
                      添加钻练任务
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>添加钻练任务</DialogTitle>
                      <DialogDescription>
                        {SLICE_HINTS[sliceType]}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>切片方式</Label>
                        <Select
                          value={sliceType}
                          onValueChange={(v) => setSliceType(v as DrillSliceType)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DRILL_SLICE_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {DRILL_SLICE_LABELS[t]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="drill-title">任务</Label>
                        <Input
                          id="drill-title"
                          value={drillTitle}
                          onChange={(e) => setDrillTitle(e.target.value)}
                          placeholder="如：只练 join 语句的表顺序，循环 20 遍"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDrillFor(null)}>
                        取消
                      </Button>
                      <Button
                        onClick={addDrillSubmit}
                        disabled={pending || !drillTitle.trim()}
                      >
                        {pending && <Loader2 className="size-4 animate-spin" />}
                        加入钻练
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* 验证结论 */}
      <Dialog
        open={verifyFor != null}
        onOpenChange={(v) => !v && setVerifyFor(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>回练习验证通过？</DialogTitle>
            <DialogDescription>
              「{verifyFor?.title ?? ""}」——在直接练习里用过之后，它真的解决了吗？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="verify-result">验证结论（可选）</Label>
            <Textarea
              id="verify-result"
              rows={3}
              value={verifyResult}
              onChange={(e) => setVerifyResult(e.target.value)}
              placeholder="回到练习后的实际效果；仍有卡顿就退回重练"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyFor(null)}>
              还没验证
            </Button>
            <Button onClick={verifySubmit} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              通过，解决这个弱点
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
