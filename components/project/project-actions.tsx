"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Archive,
  CheckCircle2,
  MoreHorizontal,
  Pause,
  Play,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { changeProjectStatus, deleteProject } from "@/server/actions/projects";

export function ProjectActions({
  projectId,
  status,
}: {
  projectId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const setStatus = (s: string) =>
    startTransition(async () => {
      await changeProjectStatus(projectId, s);
      router.refresh();
    });

  const remove = () =>
    startTransition(async () => {
      await deleteProject(projectId);
      router.refresh();
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={pending}
            aria-label="项目操作"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {status !== "ACTIVE" && (
            <DropdownMenuItem onClick={() => setStatus("ACTIVE")}>
              <Play className="size-4" />设为进行中
            </DropdownMenuItem>
          )}
          {status === "ACTIVE" && (
            <DropdownMenuItem onClick={() => setStatus("PAUSED")}>
              <Pause className="size-4" />暂停
            </DropdownMenuItem>
          )}
          {status !== "COMPLETED" && (
            <DropdownMenuItem onClick={() => setStatus("COMPLETED")}>
              <CheckCircle2 className="size-4" />标记完成
            </DropdownMenuItem>
          )}
          {status !== "ARCHIVED" && (
            <DropdownMenuItem onClick={() => setStatus("ARCHIVED")}>
              <Archive className="size-4" />归档
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            删除项目
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogForDelete
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={remove}
        pending={pending}
      />
    </>
  );
}

// 单独拆出，避免与列表页共用组件时的命名混乱
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

function AlertDialogForDelete({
  open,
  onOpenChange,
  onConfirm,
  pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除项目？</AlertDialogTitle>
          <AlertDialogDescription>
            项目及其全部数据（学习地图、会话、闪卡等）将被一并删除，不可恢复。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
