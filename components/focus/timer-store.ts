"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { elapsedMs } from "@/lib/focus";

// 番茄钟运行态：localStorage 持久化，刷新页面/关浏览器后计时继续。
// 会话的权威记录在数据库（Session/Interruption 表），这里只保存展示所需的镜像。

export type PendingInterruption = {
  reason: string;
  seconds: number;
  atMs: number;
};

type TimerState = {
  sessionId: string | null;
  projectId: string | null;
  startedAtMs: number | null;
  plannedMinutes: number;
  status: "idle" | "running" | "paused";
  pausedElapsedMs: number;
  lastResumeAtMs: number;
  interruptions: PendingInterruption[];
  start: (p: {
    sessionId: string;
    projectId: string;
    startedAtMs: number;
    plannedMinutes: number;
  }) => void;
  pause: () => void;
  resume: () => void;
  addInterruption: (i: PendingInterruption) => void;
  clear: () => void;
};

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      sessionId: null,
      projectId: null,
      startedAtMs: null,
      plannedMinutes: 25,
      status: "idle",
      pausedElapsedMs: 0,
      lastResumeAtMs: 0,
      interruptions: [],
      start: (p) =>
        set({
          ...p,
          status: "running",
          pausedElapsedMs: 0,
          lastResumeAtMs: Date.now(),
          interruptions: [],
        }),
      pause: () =>
        set((s) => {
          if (s.status !== "running") return {};
          return {
            status: "paused",
            pausedElapsedMs: elapsedMs(
              {
                status: s.status,
                startedAtMs: s.startedAtMs,
                pausedElapsedMs: s.pausedElapsedMs,
                lastResumeAtMs: s.lastResumeAtMs,
                plannedMinutes: s.plannedMinutes,
              },
              Date.now(),
            ),
          };
        }),
      resume: () =>
        set((s) =>
          s.status === "paused"
            ? { status: "running", lastResumeAtMs: Date.now() }
            : {},
        ),
      addInterruption: (i) =>
        set((s) => ({ interruptions: [...s.interruptions, i] })),
      clear: () =>
        set({
          sessionId: null,
          projectId: null,
          startedAtMs: null,
          status: "idle",
          pausedElapsedMs: 0,
          lastResumeAtMs: 0,
          interruptions: [],
        }),
    }),
    { name: "ulos-timer" },
  ),
);
