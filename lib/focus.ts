// 专注计时的纯函数核心：可单测，UI 与持久化都基于这里。

export type TimerSnapshot = {
  status: "idle" | "running" | "paused";
  startedAtMs: number | null;
  pausedElapsedMs: number; // 暂停时冻结的已进行时长
  lastResumeAtMs: number; // 最近一次（继续）开始的本地时刻
  plannedMinutes: number;
};

/** 已专注时长（毫秒）。本地优先：startedAtMs 来自服务端落库时间，同机时钟一致 */
export function elapsedMs(s: TimerSnapshot, nowMs: number): number {
  if (s.status === "idle" || s.startedAtMs == null) return 0;
  if (s.status === "paused") return s.pausedElapsedMs;
  return s.pausedElapsedMs + Math.max(0, nowMs - s.lastResumeAtMs);
}

/** 剩余时长（毫秒），可为负（超时继续专注时按实际计） */
export function remainingMs(s: TimerSnapshot, nowMs: number): number {
  return s.plannedMinutes * 60_000 - elapsedMs(s, nowMs);
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ---------- 近 7 天统计 ----------

export type StatsSession = {
  startedAt: Date | string;
  actualMinutes: number | null;
  focusRating: number | null;
  interruptions: unknown[];
};

export type WeekStats = {
  count: number;
  totalMinutes: number;
  interruptions: number;
  avgFocus: number | null;
};

export function weekStats(sessions: StatsSession[], nowMs = Date.now()): WeekStats {
  const cutoff = nowMs - 7 * 24 * 60 * 60 * 1000;
  const recent = sessions.filter(
    (s) => new Date(s.startedAt).getTime() >= cutoff,
  );
  const ratings = recent
    .map((s) => s.focusRating)
    .filter((r): r is number => r != null);
  return {
    count: recent.length,
    totalMinutes: recent.reduce((n, s) => n + (s.actualMinutes ?? 0), 0),
    interruptions: recent.reduce((n, s) => n + s.interruptions.length, 0),
    avgFocus: ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null,
  };
}
