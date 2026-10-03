import { describe, expect, it } from "vitest";

import { elapsedMs, formatClock, remainingMs, weekStats } from "@/lib/focus";
import type { TimerSnapshot } from "@/lib/focus";

describe("计时快照", () => {
  const base: TimerSnapshot = {
    status: "running",
    startedAtMs: 1000,
    pausedElapsedMs: 0,
    lastResumeAtMs: 1000,
    plannedMinutes: 25,
  };

  it("running 按最近一次开始时刻累计", () => {
    expect(elapsedMs(base, 61_000)).toBe(60_000);
  });

  it("paused 冻结已进行时长", () => {
    expect(
      elapsedMs({ ...base, status: "paused", pausedElapsedMs: 30_000 }, 91_000),
    ).toBe(30_000);
  });

  it("暂停后继续，接着原来的时长累计", () => {
    expect(
      elapsedMs(
        { ...base, pausedElapsedMs: 30_000, lastResumeAtMs: 91_000 },
        121_000,
      ),
    ).toBe(60_000);
  });

  it("idle 为 0", () => {
    expect(elapsedMs({ ...base, status: "idle" }, 999_999)).toBe(0);
  });

  it("剩余时长可以为负（超时继续）", () => {
    expect(remainingMs({ ...base, plannedMinutes: 1 }, 121_000)).toBeLessThanOrEqual(0);
  });

  it("formatClock 输出 MM:SS 且不为负", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65_000)).toBe("01:05");
    expect(formatClock(-5_000)).toBe("00:00");
  });
});

describe("近 7 天统计", () => {
  const now = Date.parse("2026-10-03T12:00:00Z");
  const mk = (
    startedAt: string,
    actualMinutes: number | null,
    focusRating: number | null,
    nInterruptions: number,
  ) => ({
    startedAt,
    actualMinutes,
    focusRating,
    interruptions: Array.from({ length: nInterruptions }),
  });

  it("只统计最近 7 天的会话", () => {
    const s = weekStats(
      [mk("2026-09-20T00:00:00Z", 25, 5, 0), mk("2026-10-02T00:00:00Z", 30, 4, 2)],
      now,
    );
    expect(s.count).toBe(1);
    expect(s.totalMinutes).toBe(30);
    expect(s.interruptions).toBe(2);
  });

  it("平均自评忽略未评分的会话", () => {
    const s = weekStats(
      [mk("2026-10-02T00:00:00Z", 25, 5, 0), mk("2026-10-01T00:00:00Z", 25, null, 0)],
      now,
    );
    expect(s.avgFocus).toBe(5);
  });

  it("没有会话时返回零值", () => {
    const s = weekStats([], now);
    expect(s.count).toBe(0);
    expect(s.totalMinutes).toBe(0);
    expect(s.avgFocus).toBeNull();
  });
});
