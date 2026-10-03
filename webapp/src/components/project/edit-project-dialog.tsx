"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { CATEGORY_LABELS, CATEGORIES } from "@/lib/domain";
import { updateProject } from "@/lib/storage";
import {
  projectFieldsSchema,
  type ProjectFieldsInput,
} from "@/lib/validators/project";

export function EditProjectDialog({
  project,
}: {
  project: {
    id: string;
    name: string;
    category: string;
    why: string | null;
    what: string | null;
    how: string | null;
    plannedHours: number;
    deadlineIso: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProjectFieldsInput>({
    resolver: zodResolver(projectFieldsSchema),
    defaultValues: {
      name: project.name,
      category: project.category as ProjectFieldsInput["category"],
      why: project.why ?? "",
      what: project.what ?? "",
      how: project.how ?? "",
      plannedHours: project.plannedHours,
      deadline: project.deadlineIso,
    },
  });

  function onSubmit(values: ProjectFieldsInput) {
    setError(null);
    startTransition(async () => {
      const res = await updateProject(project.id, values);
      if (res.ok) {
        setOpen(false);
        
      } else {
        setError(res.error);
      }
    });
  }

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          编辑
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑项目</DialogTitle>
          <DialogDescription>
            修改 Why / What / How 与计划；研究预算会按 10% 规则重新计算。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">项目名称</Label>
            <Input id="edit-name" {...form.register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
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
              <Label htmlFor="edit-hours">计划总时长（小时）</Label>
              <Input
                id="edit-hours"
                type="number"
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
            <Label htmlFor="edit-deadline">目标日期（可选）</Label>
            <Input
              id="edit-deadline"
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
            <Label htmlFor="edit-why">Why：为什么学</Label>
            <Textarea id="edit-why" rows={2} {...form.register("why")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-what">What：学成什么样</Label>
            <Textarea id="edit-what" rows={2} {...form.register("what")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-how">How：怎么学</Label>
            <Textarea id="edit-how" rows={2} {...form.register("how")} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
