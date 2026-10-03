"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Check, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  calcResearchBudget,
  CATEGORY_LABELS,
  CATEGORIES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPES,
  TOPIC_KIND_LABELS,
  TOPIC_KINDS,
} from "@/lib/domain";
import { PRINCIPLES } from "@/lib/principles";
import { cn } from "@/lib/utils";
import { createProject } from "@/server/actions/projects";
import { wizardSchema, type WizardInput } from "@/lib/validators/project";

const STEPS = ["Why · 为什么学", "What · 学什么", "How · 怎么学", "确认创建"];

export function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<WizardInput>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      name: "",
      category: "CODING",
      why: "",
      what: "",
      how: "",
      plannedHours: 60,
      deadline: "",
      topics: [],
      resources: [],
    },
  });
  const topicsArray = useFieldArray({ control: form.control, name: "topics" });
  const resourcesArray = useFieldArray({
    control: form.control,
    name: "resources",
  });

  const errors = form.formState.errors;
  // 确认页展示用快照：getValues 不建立订阅，避免 watch 引发的重渲染风暴
  const values = form.getValues();
  const topics = values.topics ?? [];
  const resources = values.resources ?? [];
  const checklistTotal = PRINCIPLES.reduce(
    (n, p) => n + p.checklist.length,
    0,
  );

  const stepFields: (keyof WizardInput)[][] = [
    ["name", "category", "why", "plannedHours", "deadline"],
    ["what", "topics"],
    ["how", "resources"],
    [],
  ];

  async function next() {
    const ok = await form.trigger(stepFields[step]);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function onSubmit(v: WizardInput) {
    setError(null);
    startTransition(async () => {
      const res = await createProject(v);
      if (res.ok && res.data) {
        router.push(`/projects/${res.data.id}`);
      } else {
        setError(res.ok ? "创建失败，请重试" : res.error);
      }
    });
  }

  return (
    // 提交永远由「创建项目」按钮显式触发（见 footer），
    // form 本身禁止隐式提交：避免步骤切换时点击落到换入的 submit 按钮上、
    // 或在输入框里按回车导致重复创建
    <form
      onSubmit={(e) => e.preventDefault()}
    >
      {/* 步骤条 */}
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                i < step && "bg-primary text-primary-foreground",
                i === step && "bg-primary text-primary-foreground",
                i > step && "border text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-xs sm:block",
                i === step ? "font-medium" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="h-px flex-1 bg-border" aria-hidden />
            )}
          </li>
        ))}
      </ol>

      <Card className="mt-6">
        <CardContent className="space-y-5 pt-6">
          {step === 0 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="wz-name">项目名称</Label>
                <Input
                  id="wz-name"
                  placeholder="如：Python 数据分析 60 天"
                  {...form.register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>类别</Label>
                  <Controller
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {CATEGORY_LABELS[c]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wz-hours">计划总时长（小时）</Label>
                  <Input
                    id="wz-hours"
                    type="number"
                    min={0}
                    {...form.register("plannedHours", { valueAsNumber: true })}
                  />
                  {errors.plannedHours && (
                    <p className="text-xs text-destructive">
                      {errors.plannedHours.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wz-deadline">目标日期（可选）</Label>
                <Input
                  id="wz-deadline"
                  type="date"
                  {...form.register("deadline")}
                />
                {errors.deadline && (
                  <p className="text-xs text-destructive">
                    {errors.deadline.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wz-why">Why：为什么学？</Label>
                <Textarea
                  id="wz-why"
                  rows={3}
                  placeholder="驱动你的真实原因、应用场景。学完之后，你会在什么场合用它？"
                  {...form.register("why")}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="wz-what">What：学成什么样？</Label>
                <Textarea
                  id="wz-what"
                  rows={3}
                  placeholder="描述学会后能做到的事：能独立完成什么？拿出什么作品/通过什么考试？"
                  {...form.register("what")}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>主题清单（概念 / 事实 / 程序）</Label>
                  <span className="text-xs text-muted-foreground">
                    可以先粗列，之后在学习地图里继续补
                  </span>
                </div>
                {topics.length === 0 && (
                  <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                    把要学的内容拆成一条条主题，并标注类型
                  </p>
                )}
                {topicsArray.fields.map((f, i) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <Input
                      placeholder={`主题 ${i + 1}，如：DataFrame 与 Series 的区别`}
                      {...form.register(`topics.${i}.name`)}
                    />
                    <Controller
                      control={form.control}
                      name={`topics.${i}.kind`}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-24 shrink-0">
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
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 shrink-0 text-muted-foreground"
                      onClick={() => topicsArray.remove(i)}
                      aria-label="移除主题"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                {typeof errors.topics?.message === "string" && (
                  <p className="text-xs text-destructive">
                    {errors.topics.message}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => topicsArray.append({ name: "", kind: "CONCEPT" })}
                >
                  <Plus className="size-4" />
                  添加主题
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="wz-how">How：怎么学？</Label>
                <Textarea
                  id="wz-how"
                  rows={3}
                  placeholder="方法与资源策略：以什么形式做直接练习？每周节奏？遇到弱点怎么办？"
                  {...form.register("how")}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>资源清单</Label>
                  <span className="text-xs text-muted-foreground">
                    勾选「基准」标记用来对照高手水平的资源
                  </span>
                </div>
                {resources.length === 0 && (
                  <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                    课程 / 书籍 / 导师 / 社区……先放上你打算用的
                  </p>
                )}
                {resourcesArray.fields.map((f, i) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <Input
                      placeholder={`资源 ${i + 1} 名称`}
                      {...form.register(`resources.${i}.title`)}
                    />
                    <Input
                      placeholder="链接（可选）"
                      className="hidden w-48 lg:block"
                      {...form.register(`resources.${i}.url`)}
                    />
                    <Controller
                      control={form.control}
                      name={`resources.${i}.type`}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-20 shrink-0">
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
                      )}
                    />
                    <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <Checkbox
                        checked={values.resources[i]?.isBenchmark ?? false}
                        onCheckedChange={(v) =>
                          form.setValue(`resources.${i}.isBenchmark`, v === true)
                        }
                      />
                      基准
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 shrink-0 text-muted-foreground"
                      onClick={() => resourcesArray.remove(i)}
                      aria-label="移除资源"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                {typeof errors.resources?.message === "string" && (
                  <p className="text-xs text-destructive">
                    {errors.resources.message}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    resourcesArray.append({
                      title: "",
                      url: "",
                      type: "OTHER",
                      isBenchmark: false,
                    })
                  }
                >
                  <Plus className="size-4" />
                  添加资源
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="项目名称" value={values.name} />
                <InfoRow
                  label="类别"
                  value={CATEGORY_LABELS[values.category]}
                />
                <InfoRow
                  label="计划总时长"
                  value={`${values.plannedHours} 小时`}
                />
                <InfoRow
                  label="目标日期"
                  value={values.deadline ? values.deadline : "未设置"}
                />
              </div>
              <InfoBlock label="Why" text={values.why} />
              <InfoBlock label="What" text={values.what} />
              <InfoBlock label="How" text={values.how} />
              <p className="text-muted-foreground">
                主题 {topics.length} 个 · 资源 {resources.length} 个（基准{" "}
                {resources.filter((r) => r.isBenchmark).length} 个）
              </p>
              <div className="rounded-lg border bg-accent/40 p-4">
                <p className="flex items-center gap-1.5 font-medium">
                  <CalendarDays className="size-4" />
                  研究预算：{calcResearchBudget(values.plannedHours)} 小时
                </p>
                <p className="mt-1 text-muted-foreground">
                  按 10% 研究规则，画地图、找基准资源、访谈专家的时间不超过计划总时长的
                  10%——研究是为了更快开工，不是拖延的理由。
                </p>
              </div>
              <p className="text-muted-foreground">
                创建后将自动生成九原则检查清单（{checklistTotal} 项），可在项目概览逐条勾选。
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || pending}
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
        >
          上一步
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next} disabled={pending}>
            下一步
          </Button>
        ) : (
          // type="button" + 显式 handleSubmit：不依赖表单隐式提交，
          // 即使步骤切换的瞬间点击落错按钮，也不会触发重复创建
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={pending}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            创建项目
          </Button>
        )}
      </div>
    </form>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-medium">{value || "—"}</p>
    </div>
  );
}

function InfoBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap">{text || "—"}</p>
    </div>
  );
}
