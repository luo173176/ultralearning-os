import { describe, expect, it } from "vitest";

import {
  describeInterval,
  newScheduling,
  schedule,
  type CardScheduling,
} from "@/lib/sm2";

const NOW = new Date("2026-10-03T08:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

const mature: CardScheduling = {
  intervalDays: 15,
  easeFactor: 2.5,
  reps: 3,
  lapses: 0,
};

describe("SM-2 调度", () => {
  it("新卡 GOOD：reps=1，明天到期，难度不变", () => {
    const r = schedule(newScheduling(NOW), "GOOD", NOW);
    expect(r.reps).toBe(1);
    expect(r.intervalDays).toBe(1);
    expect(r.easeFactor).toBe(2.5);
    expect(r.dueAt.getTime()).toBe(NOW.getTime() + DAY);
  });

  it("连续 GOOD：1 → 6 → 15 天的标准爬升", () => {
    let c = newScheduling(NOW);
    c = schedule(c, "GOOD", NOW);
    c = schedule(c, "GOOD", NOW);
    expect(c.reps).toBe(2);
    expect(c.intervalDays).toBe(6);
    c = schedule(c, "GOOD", NOW);
    expect(c.reps).toBe(3);
    expect(c.intervalDays).toBe(15); // round(6 * 2.5)
  });

  it("HARD 下调难度系数", () => {
    const r = schedule(mature, "HARD", NOW);
    expect(r.easeFactor).toBeCloseTo(2.36, 5);
    expect(r.intervalDays).toBe(35); // round(15 * 2.36)
    expect(r.lapses).toBe(0);
  });

  it("EASY 上调难度系数", () => {
    const r = schedule(mature, "EASY", NOW);
    expect(r.easeFactor).toBeCloseTo(2.6, 5);
    expect(r.intervalDays).toBe(39); // round(15 * 2.6)
  });

  it("AGAIN 重置为重学、1 天后重来、lapses+1、难度下调", () => {
    const r = schedule(mature, "AGAIN", NOW);
    expect(r.reps).toBe(0);
    expect(r.intervalDays).toBe(1);
    expect(r.lapses).toBe(1);
    expect(r.easeFactor).toBeCloseTo(1.7, 5);
  });

  it("难度系数下限 1.3，不会无限下降", () => {
    let c: CardScheduling = { ...mature, easeFactor: 1.3 };
    c = schedule(c, "AGAIN", NOW);
    expect(c.easeFactor).toBe(1.3);
  });

  it("重学后再次 GOOD 从 1 天重新爬升", () => {
    const lapsed = schedule(mature, "AGAIN", NOW);
    const r = schedule(lapsed, "GOOD", NOW);
    expect(r.reps).toBe(1);
    expect(r.intervalDays).toBe(1);
  });

  it("describeInterval 的人话输出", () => {
    expect(describeInterval(0)).toBe("现在");
    expect(describeInterval(1)).toBe("明天");
    expect(describeInterval(15)).toBe("15 天后");
    expect(describeInterval(60)).toBe("2 个月后");
    expect(describeInterval(400)).toBe("1.1 年后");
  });
});
