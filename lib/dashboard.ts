// 九原则仪表盘的状态推导：纯函数，输入项目聚合数据，输出每原则的状态/现状/建议。
// 状态三档：NOT_STARTED 未开始 / IN_PROGRESS 进行中 / HEALTHY 健康。
// 反馈/直觉/实验模块在 v0.2/v0.3 才有专属数据，现阶段由检查清单完成度推导。

import { PRINCIPLES, type PrincipleKey } from "@/lib/principles";

export type PrincipleStatus = "NOT_STARTED" | "IN_PROGRESS" | "HEALTHY";

export const PRINCIPLE_STATUS_META: Record<
  PrincipleStatus,
  { label: string }
> = {
  NOT_STARTED: { label: "未开始" },
  IN_PROGRESS: { label: "进行中" },
  HEALTHY: { label: "健康" },
};

const DAY = 24 * 60 * 60 * 1000;

export type DashboardInput = {
  now: Date;
  project: { why: string | null; what: string | null; how: string | null };
  topicCount: number;
  benchmarkCount: number;
  checklist: { principle: number; isDone: boolean }[];
  sessions: { startedAt: Date | string; interruptionCount: number }[];
  practices: { status: string }[];
  weakPoints: { status: string }[];
  drills: { status: string }[];
  cards: { reps: number; suspended: boolean; dueAt: Date | string }[];
  /** 近 7 天复习 + 检索练习总次数 */
  retrievalRecentCount: number;
  /** 已逾期（到期时间早于今天零点）且未挂起的卡数 */
  overdueCardCount: number;
};

export type PrincipleCard = {
  key: PrincipleKey;
  order: number;
  zh: string;
  en: string;
  status: PrincipleStatus;
  headline: string;
  suggestion: string;
  checklistDone: number;
  checklistTotal: number;
};

function withinDays(d: Date | string, days: number, now: Date): boolean {
  return new Date(d).getTime() >= now.getTime() - days * DAY;
}

function checklistFor(
  input: DashboardInput,
  principle: number,
): { done: number; total: number } {
  const items = input.checklist.filter((c) => c.principle === principle);
  return { done: items.filter((c) => c.isDone).length, total: items.length };
}

function fromChecklist(
  input: DashboardInput,
  principle: number,
  notStartedTip: string,
  healthyTip: string,
): { status: PrincipleStatus; headline: string; suggestion: string } {
  const { done, total } = checklistFor(input, principle);
  if (total === 0 || done === 0) {
    return { status: "NOT_STARTED", headline: `清单 0/${total}`, suggestion: notStartedTip };
  }
  if (done < total) {
    return {
      status: "IN_PROGRESS",
      headline: `清单 ${done}/${total}`,
      suggestion: "按检查清单逐条推进，做完就勾。",
    };
  }
  return { status: "HEALTHY", headline: `清单 ${done}/${total}`, suggestion: healthyTip };
}

export function buildDashboard(input: DashboardInput): PrincipleCard[] {
  const now = input.now;
  const cards: PrincipleCard[] = [];

  // 1 元学习
  {
    const filled = [input.project.why, input.project.what, input.project.how].filter(Boolean).length;
    let r: { status: PrincipleStatus; headline: string; suggestion: string };
    if (filled === 0 && input.topicCount === 0) {
      r = {
        status: "NOT_STARTED",
        headline: "还没有画地图",
        suggestion: "先花 10% 时间画地图：补齐 Why/What/How，列出主题清单。",
      };
    } else if (filled === 3 && input.topicCount >= 5 && input.benchmarkCount >= 1) {
      r = {
        status: "HEALTHY",
        headline: `地图就绪 · 主题 ${input.topicCount} 个`,
        suggestion: "元学习到位了，把时间投给直接练习。",
      };
    } else {
      r = {
        status: "IN_PROGRESS",
        headline: `三问 ${filled}/3 · 主题 ${input.topicCount}`,
        suggestion: "补齐三问、主题至少 5 条，并标记 1 个基准资源。",
      };
    }
    cards.push(make(1, r, input));
  }

  // 2 专注
  {
    const last7 = input.sessions.filter((s) => withinDays(s.startedAt, 7, now));
    const interruptions = last7.reduce((n, s) => n + s.interruptionCount, 0);
    let r: { status: PrincipleStatus; headline: string; suggestion: string };
    if (last7.length === 0) {
      r = {
        status: "NOT_STARTED",
        headline: "近 7 天没有学习会话",
        suggestion: "开一个番茄钟：先从每天一个完整会话开始。",
      };
    } else if (last7.length >= 3) {
      r = {
        status: "HEALTHY",
        headline: `本周 ${last7.length} 次会话 · 分心 ${interruptions} 次`,
        suggestion: "节奏很好。留意分心来源，守住整块时间。",
      };
    } else {
      r = {
        status: "IN_PROGRESS",
        headline: `本周 ${last7.length} 次会话 · 分心 ${interruptions} 次`,
        suggestion: "再固定 1-2 个学习时段，把会话攒到每周 3 次以上。",
      };
    }
    cards.push(make(2, r, input));
  }

  // 3 直接性
  {
    const active = input.practices.some((p) => p.status === "IN_PROGRESS");
    const done = input.practices.some((p) => p.status === "DONE");
    let r: { status: PrincipleStatus; headline: string; suggestion: string };
    if (input.practices.length === 0) {
      r = {
        status: "NOT_STARTED",
        headline: "还没有直接练习",
        suggestion: "定义一个真实产出物（项目/作品/考试）——输入不等于学会。",
      };
    } else if (active) {
      r = {
        status: "HEALTHY",
        headline: "有进行中的直接练习",
        suggestion: "大部分学习时间花在直接练习上——方向正确。",
      };
    } else if (done) {
      r = {
        status: "IN_PROGRESS",
        headline: "练习都已完成",
        suggestion: "开一个新练习，或复盘上一轮的产出。",
      };
    } else {
      r = {
        status: "IN_PROGRESS",
        headline: "练习还在计划中",
        suggestion: "把第一个练习推进起来：点「开始练习」。",
      };
    }
    cards.push(make(3, r, input));
  }

  // 4 钻练
  {
    let r: { status: PrincipleStatus; headline: string; suggestion: string };
    if (input.weakPoints.length === 0) {
      r = {
        status: "NOT_STARTED",
        headline: "还没有登记弱点",
        suggestion: "在直接练习里点「发现弱点」——短板暴露出来才能被攻克。",
      };
    } else {
      const open = input.weakPoints.filter((w) => w.status !== "RESOLVED").length;
      const awaiting = input.drills.filter((d) => d.status === "AWAIT_VERIFY").length;
      if (open === 0) {
        r = {
          status: "HEALTHY",
          headline: `弱点 ${input.weakPoints.length} 个全部解决`,
          suggestion: "干净。继续在练习里捕捉新弱点。",
        };
      } else if (awaiting > 0) {
        r = {
          status: "IN_PROGRESS",
          headline: `${awaiting} 个钻练待验证`,
          suggestion: "回到直接练习验证钻练效果，通过才算真掌握。",
        };
      } else {
        r = {
          status: "IN_PROGRESS",
          headline: `${open} 个弱点待攻克`,
          suggestion: "为弱点创建钻练任务，切片隔离、集中火力。",
        };
      }
    }
    cards.push(make(4, r, input));
  }

  // 5 提取
  {
    const activeCards = input.cards.filter((c) => !c.suspended);
    const dueCount = activeCards.filter((c) => new Date(c.dueAt) <= now).length;
    let r: { status: PrincipleStatus; headline: string; suggestion: string };
    if (activeCards.length === 0 && input.retrievalRecentCount === 0) {
      r = {
        status: "NOT_STARTED",
        headline: "还没有闪卡或检索练习",
        suggestion: "为核心知识建卡；读完一个章节，先做一次自由回忆。",
      };
    } else if (input.retrievalRecentCount > 0 && dueCount <= 10) {
      r = {
        status: "HEALTHY",
        headline: `今日到期 ${dueCount} 张`,
        suggestion: "检索节奏健康——用测试代替重读。",
      };
    } else {
      r = {
        status: "IN_PROGRESS",
        headline: `今日到期 ${dueCount} 张`,
        suggestion: "先清空今日到期队列，再做新的输入。",
      };
    }
    cards.push(make(5, r, input));
  }

  // 6 反馈（模块 v0.2 上线，先按清单推导）
  cards.push(
    make(
      6,
      fromChecklist(
        input,
        6,
        "反馈模块将在 v0.2 上线。现阶段先有意识地收集反馈：找导师/同伴点评，或对照基准资源自查。",
        "反馈习惯已建立。等 v0.2 模块上线后可以结构化记录。",
      ),
      input,
    ),
  );

  // 7 保持
  {
    const reviewed = input.cards.filter((c) => c.reps > 0).length;
    let r: { status: PrincipleStatus; headline: string; suggestion: string };
    if (input.cards.length === 0) {
      r = {
        status: "NOT_STARTED",
        headline: "保持机制未启动",
        suggestion: "闪卡是保持的主引擎——先有卡，才有间隔重复。",
      };
    } else if (input.overdueCardCount === 0 && reviewed > 0) {
      r = {
        status: "HEALTHY",
        headline: `无逾期 · ${reviewed} 张在复习中`,
        suggestion: "漏桶没有漏水。可以试试过度学习：对关键技能加练。",
      };
    } else {
      r = {
        status: "IN_PROGRESS",
        headline: `${input.overdueCardCount} 张已逾期`,
        suggestion: "先清逾期，再学新的——不要往漏桶里灌水。",
      };
    }
    cards.push(make(7, r, input));
  }

  // 8 直觉（模块 v0.2 上线）
  cards.push(
    make(
      8,
      fromChecklist(
        input,
        8,
        "费曼笔记模块将在 v0.2 上线。现阶段试着用大白话向别人解释核心概念，卡壳的地方就是要补的洞。",
        "能解释清楚才是真懂。继续保持输出习惯。",
      ),
      input,
    ),
  );

  // 9 实验（模块 v0.3 上线）
  cards.push(
    make(
      9,
      fromChecklist(
        input,
        9,
        "实验模块将在 v0.3 上线。现阶段可以手动 A/B：比如对比早晚学习的产出，把结论记在会话备注里。",
        "把方法当实验对象，是这个原则的精髓。继续保持。",
      ),
      input,
    ),
  );

  return cards;

  function make(
    order: number,
    r: { status: PrincipleStatus; headline: string; suggestion: string },
    inp: DashboardInput,
  ): PrincipleCard {
    const p = PRINCIPLES[order - 1];
    const { done, total } = checklistFor(inp, order);
    return {
      key: p.key as PrincipleKey,
      order,
      zh: p.zh,
      en: p.en,
      checklistDone: done,
      checklistTotal: total,
      ...r,
    };
  }
}
