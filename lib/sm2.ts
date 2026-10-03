// 简化 SM-2 间隔重复算法（SuperMemo-2 的 Anki 式四档变体）。
// 纯函数、可解释、可单测；接口与具体算法隔离，未来可整体换成 FSRS 而不动 UI。
//
// 规则：
// - AGAIN（没想起）：重置为重学（reps=0），1 天后重来，lapses+1，难度下调
// - HARD / GOOD / EASY：reps+1；第 1 次 → 1 天，第 2 次 → 6 天，之后 = 上次间隔 × 难度系数
// - 难度系数 EF 按四档质量分调整（GOOD 持平，HARD 下调，EASY 上调），下限 1.3

export type Grade = "AGAIN" | "HARD" | "GOOD" | "EASY";

export type CardScheduling = {
  intervalDays: number;
  easeFactor: number;
  reps: number;
  lapses: number;
};

export type ScheduledCard = CardScheduling & { dueAt: Date };

export const GRADES: Grade[] = ["AGAIN", "HARD", "GOOD", "EASY"];

const QUALITY: Record<Grade, number> = { AGAIN: 0, HARD: 3, GOOD: 4, EASY: 5 };

const MIN_EASE = 1.3;

function nextEase(easeFactor: number, quality: number): number {
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  return Math.max(MIN_EASE, easeFactor + delta);
}

/** 新卡的初始调度状态：立即到期，进入今日队列 */
export function newScheduling(now: Date): ScheduledCard {
  return {
    intervalDays: 0,
    easeFactor: 2.5,
    reps: 0,
    lapses: 0,
    dueAt: now,
  };
}

export function schedule(
  card: CardScheduling,
  grade: Grade,
  now: Date,
): ScheduledCard {
  const q = QUALITY[grade];
  let { intervalDays, easeFactor, reps, lapses } = card;

  if (grade === "AGAIN") {
    reps = 0;
    lapses += 1;
    intervalDays = 1;
    easeFactor = nextEase(easeFactor, q);
  } else {
    reps += 1;
    if (reps === 1) {
      intervalDays = 1;
    } else if (reps === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(
        1,
        Math.round(intervalDays * nextEase(easeFactor, q)),
      );
    }
    easeFactor = nextEase(easeFactor, q);
  }

  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return { intervalDays, easeFactor, reps, lapses, dueAt };
}

/** 复习后的人话提示，如「1 天后」「2.5 个月后」 */
export function describeInterval(intervalDays: number): string {
  if (intervalDays <= 0) return "现在";
  if (intervalDays === 1) return "明天";
  if (intervalDays < 30) return `${intervalDays} 天后`;
  if (intervalDays < 365) {
    const months = (intervalDays / 30).toFixed(intervalDays % 30 === 0 ? 0 : 1);
    return `${months} 个月后`;
  }
  const years = (intervalDays / 365).toFixed(1);
  return `${years} 年后`;
}
