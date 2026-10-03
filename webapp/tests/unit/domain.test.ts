import { describe, expect, it } from "vitest";

import {
  calcResearchBudget,
  DRILL_SLICE_LABELS,
  DRILL_SLICE_TYPES,
  DRILL_STATUSES,
  DRILL_STATUS_META,
  PRACTICE_FORMS,
  PRACTICE_FORM_LABELS,
  PRACTICE_STATUSES,
  PRACTICE_STATUS_META,
  WEAK_POINT_SOURCE_LABELS,
  WEAK_POINT_SOURCES,
  WEAK_POINT_STATUSES,
  WEAK_POINT_STATUS_META,
} from "@/lib/domain";
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

describe("阶段 4 领域标签完整性", () => {
  it("每种练习形态都有中文标签", () => {
    for (const f of PRACTICE_FORMS) expect(PRACTICE_FORM_LABELS[f]).toBeTruthy();
  });

  it("练习/弱点/钻练状态都有元数据", () => {
    for (const s of PRACTICE_STATUSES) expect(PRACTICE_STATUS_META[s]).toBeTruthy();
    for (const s of WEAK_POINT_STATUSES) expect(WEAK_POINT_STATUS_META[s]).toBeTruthy();
    for (const s of DRILL_STATUSES) expect(DRILL_STATUS_META[s]).toBeTruthy();
  });

  it("五种钻练切片与弱点来源都有标签", () => {
    for (const t of DRILL_SLICE_TYPES) expect(DRILL_SLICE_LABELS[t]).toBeTruthy();
    for (const s of WEAK_POINT_SOURCES) {
      expect(WEAK_POINT_SOURCE_LABELS[s]).toBeTruthy();
    }
  });
});
