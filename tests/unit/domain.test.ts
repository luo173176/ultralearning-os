import { describe, expect, it } from "vitest";

import { calcResearchBudget } from "@/lib/domain";
import { wizardSchema } from "@/lib/validators/project";

describe("10% 研究规则", () => {
  it("按向上取整计算研究预算", () => {
    expect(calcResearchBudget(60)).toBe(6);
    expect(calcResearchBudget(61)).toBe(7);
    expect(calcResearchBudget(5)).toBe(1);
  });

  it("非正数返回 0", () => {
    expect(calcResearchBudget(0)).toBe(0);
    expect(calcResearchBudget(-3)).toBe(0);
  });
});

describe("项目创建校验", () => {
  const base = {
    category: "CODING",
    why: "",
    what: "",
    how: "",
    plannedHours: 10,
    deadline: "",
    topics: [],
    resources: [],
  };

  it("合法输入通过", () => {
    const r = wizardSchema.safeParse({ ...base, name: "测试项目" });
    expect(r.success).toBe(true);
  });

  it("缺少名称不通过", () => {
    const r = wizardSchema.safeParse({ ...base, name: "" });
    expect(r.success).toBe(false);
  });

  it("非法日期格式不通过", () => {
    const r = wizardSchema.safeParse({
      ...base,
      name: "x",
      deadline: "2026/1/1",
    });
    expect(r.success).toBe(false);
  });

  it("空的资源链接被允许", () => {
    const r = wizardSchema.safeParse({
      ...base,
      name: "x",
      resources: [{ title: "书", url: "", type: "BOOK", isBenchmark: false }],
    });
    expect(r.success).toBe(true);
  });
});
