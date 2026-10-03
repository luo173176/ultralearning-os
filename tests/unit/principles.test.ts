import { describe, expect, it } from "vitest";

import { PRINCIPLES, getPrinciple } from "@/lib/principles";

describe("九原则元数据", () => {
  it("恰好 9 条原则", () => {
    expect(PRINCIPLES).toHaveLength(9);
  });

  it("key 唯一且 order 为 1-9", () => {
    const keys = PRINCIPLES.map((p) => p.key);
    expect(new Set(keys).size).toBe(9);
    expect(PRINCIPLES.map((p) => p.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it("每条原则都有释义与清单模板", () => {
    for (const p of PRINCIPLES) {
      expect(p.zh.length).toBeGreaterThan(0);
      expect(p.tagline.length).toBeGreaterThan(0);
      expect(p.checklist.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("getPrinciple 按 key 查找", () => {
    expect(getPrinciple("retrieval")?.zh).toBe("提取");
    expect(getPrinciple("not-exist")).toBeUndefined();
  });
});
