import type { ProjectMilestone } from "@/types";

/**
 * 段階ゴールを「基本の段階」と「ネクストゴール」に分ける。
 *
 * 基本の段階の最大額が最終目標で、達成率・達成バッジ・一覧カードの分母は
 * すべてこれ。ネクストゴール（is_stretch）は最終目標を達成したあとの
 * プラスアルファなので、分母には入れない。掲載中にネクストゴールを足しても
 * 達成済みのプロジェクトが未達成に戻らないのはこの分離のおかげ。
 *
 * is_stretch が undefined の行（列追加前のキャッシュやモック）は基本扱い。
 */
export function splitMilestones<
  T extends { amount: number; is_stretch?: boolean | null },
>(milestones: readonly T[] | null | undefined): { base: T[]; stretch: T[] } {
  const base: T[] = [];
  const stretch: T[] = [];
  for (const m of milestones ?? []) {
    (m.is_stretch ? stretch : base).push(m);
  }
  const byAmount = (a: T, b: T) => a.amount - b.amount;
  return { base: base.sort(byAmount), stretch: stretch.sort(byAmount) };
}

/**
 * 画面に出す最終目標。基本の段階があればその最大額、無ければ goal_amount。
 * ProjectDetailClient / ProjectCard / 連携API で同じ基準を使う。
 */
export function resolveFinalGoal(
  goalAmount: number,
  baseMilestones: readonly { amount: number }[]
): number {
  return baseMilestones.length > 0
    ? baseMilestones[baseMilestones.length - 1].amount
    : goalAmount;
}

/** まだ到達していない直近の段階。全部到達済みなら undefined */
export function nextUnreached<T extends { amount: number }>(
  sorted: readonly T[],
  currentAmount: number
): T | undefined {
  return sorted.find((m) => currentAmount < m.amount);
}

export type { ProjectMilestone };
