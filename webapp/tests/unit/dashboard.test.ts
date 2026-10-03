import { describe, expect, it } from "vitest";

import { buildDashboard, type DashboardInput } from "@/lib/dashboard";

const NOW = new Date("2026-10-03T10:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function baseInput(overrides: Partial<DashboardInput> = {}): DashboardInput {
  return {
    now: NOW,
    project: { why: null, what: null, how: null },
    topicCount: 0,
    benchmarkCount: 0,
    checklist: [],
    sessions: [],
    practices: [],
    weakPoints: [],
    drills: [],
    cards: [],
    retrievalRecentCount: 0,
    overdueCardCount: 0,
    ...overrides,
  };
}

const fullChecklist = () =>
  Array.from({ length: 9 }, (_, i) => ({ principle: i + 1, isDone: true }));

function get(cards: ReturnType<typeof buildDashboard>, order: number) {
  return cards.find((c) => c.order === order)!;
}

describe("九原则仪表盘推导", () => {
  it("全新项目：所有原则未开始", () => {
    const cards = buildDashboard(baseInput());
    expect(cards).toHaveLength(9);
    for (const c of cards) expect(c.status).toBe("NOT_STARTED");
  });

  it("元学习：三问齐+主题足+有基准 → 健康", () => {
    const cards = buildDashboard(
      baseInput({
        project: { why: "w", what: "a", how: "h" },
        topicCount: 6,
        benchmarkCount: 1,
      }),
    );
    expect(get(cards, 1).status).toBe("HEALTHY");
  });

  it("专注：近 7 天 3 次会话 → 健康；旧的会话不算", () => {
    const sessions = [
      { startedAt: new Date(NOW.getTime() - 1 * DAY), interruptionCount: 1 },
      { startedAt: new Date(NOW.getTime() - 2 * DAY), interruptionCount: 0 },
      { startedAt: new Date(NOW.getTime() - 3 * DAY), interruptionCount: 2 },
      { startedAt: new Date(NOW.getTime() - 20 * DAY), interruptionCount: 9 },
    ];
    const cards = buildDashboard(baseInput({ sessions }));
    expect(get(cards, 2).status).toBe("HEALTHY");
    expect(get(cards, 2).headline).toContain("3 次");
  });

  it("直接性：有进行中的练习 → 健康", () => {
    const cards = buildDashboard(
      baseInput({ practices: [{ status: "IN_PROGRESS" }] }),
    );
    expect(get(cards, 3).status).toBe("HEALTHY");
  });

  it("钻练：有待验证的钻练 → 进行中并提示验证", () => {
    const cards = buildDashboard(
      baseInput({
        weakPoints: [{ status: "DRILLING" }],
        drills: [{ status: "AWAIT_VERIFY" }],
      }),
    );
    expect(get(cards, 4).status).toBe("IN_PROGRESS");
    expect(get(cards, 4).headline).toContain("待验证");
  });

  it("钻练：弱点全部解决 → 健康", () => {
    const cards = buildDashboard(
      baseInput({
        weakPoints: [{ status: "RESOLVED" }, { status: "RESOLVED" }],
        drills: [{ status: "DONE" }],
      }),
    );
    expect(get(cards, 4).status).toBe("HEALTHY");
  });

  it("提取：近 7 天有检索且到期少 → 健康；到期堆积 → 提示清队列", () => {
    const cards = buildDashboard(
      baseInput({
        cards: [
          { reps: 2, suspended: false, dueAt: new Date(NOW.getTime() + 3 * DAY) },
          { reps: 1, suspended: false, dueAt: new Date(NOW.getTime() - 3600_000) },
        ],
        retrievalRecentCount: 3,
        overdueCardCount: 0,
      }),
    );
    expect(get(cards, 5).status).toBe("HEALTHY");
    expect(get(cards, 5).headline).toContain("到期 1 张");
  });

  it("保持：有逾期卡 → 进行中；无逾期且在复习 → 健康", () => {
    const withOverdue = buildDashboard(
      baseInput({
        cards: [{ reps: 1, suspended: false, dueAt: new Date(NOW.getTime() - 3 * DAY) }],
        overdueCardCount: 1,
      }),
    );
    expect(get(withOverdue, 7).status).toBe("IN_PROGRESS");

    const healthy = buildDashboard(
      baseInput({
        cards: [{ reps: 2, suspended: false, dueAt: new Date(NOW.getTime() + 2 * DAY) }],
      }),
    );
    expect(get(healthy, 7).status).toBe("HEALTHY");
  });

  it("反馈/直觉/实验：按检查清单推导（模块未上线）", () => {
    const cards = buildDashboard(
      baseInput({
        checklist: [
          { principle: 6, isDone: true },
          { principle: 6, isDone: false },
          { principle: 8, isDone: true },
          { principle: 8, isDone: true },
          { principle: 9, isDone: true },
          { principle: 9, isDone: true },
          { principle: 9, isDone: true },
        ],
      }),
    );
    expect(get(cards, 6).status).toBe("IN_PROGRESS");
    expect(get(cards, 8).status).toBe("HEALTHY");
    expect(get(cards, 9).status).toBe("HEALTHY");
  });

  it("九原则清单全部勾完 → 反馈/直觉/实验均健康", () => {
    const cards = buildDashboard(baseInput({ checklist: fullChecklist() }));
    expect(get(cards, 6).status).toBe("HEALTHY");
    expect(get(cards, 8).status).toBe("HEALTHY");
    expect(get(cards, 9).status).toBe("HEALTHY");
  });
});
