import type { Backer, Reward, RewardType } from "@/types";

/** 1件の支援で用意する品目1行 */
export interface PackLine {
  key: string;
  title: string;
  description?: string;
  amount: number;
  rewardType?: RewardType;
  needsAddress: boolean;
  quantity: number;
  /** 支援者が選んだプランそのものとしての個数 */
  planQuantity: number;
  /** 上位プランに含まれる下位リターンとしての個数 */
  includedQuantity: number;
}

/**
 * 支援1件で用意すべき品目を展開する。
 *
 * 上位プランはそれより安いリターンをすべて含む（累積型）。
 * 例: 30,000円プラン ×1 → 30,000円・10,000円・5,000円・3,000円のリターンを各1個。
 * 同額のリターンは別コースとみなし含めない。リターンなし（no_reward）も含めない。
 *
 * 明細（backer_items）が無い古い支援は reward_id から1個として扱う。
 * リターンが削除済みで金額が分からない明細は、その品目だけを返す。
 */
export function expandBackerRewards(
  backer: Pick<Backer, "reward_id" | "backer_items" | "rewards">,
  rewards: readonly Reward[]
): PackLine[] {
  const byId = new Map(rewards.map((r) => [r.id, r]));
  const lines = new Map<string, PackLine>();

  const add = (
    key: string,
    base: Omit<PackLine, "key" | "quantity" | "planQuantity" | "includedQuantity">,
    qty: number,
    asPlan: boolean
  ) => {
    const line =
      lines.get(key) ??
      { ...base, key, quantity: 0, planQuantity: 0, includedQuantity: 0 };
    line.quantity += qty;
    if (asPlan) line.planQuantity += qty;
    else line.includedQuantity += qty;
    lines.set(key, line);
  };

  const fromReward = (r: Reward) => ({
    title: r.title,
    description: r.description,
    amount: r.amount,
    rewardType: r.reward_type,
    needsAddress: r.needs_address,
  });

  const purchased =
    (backer.backer_items || []).length > 0
      ? (backer.backer_items || []).map((it) => ({
          rewardId: it.reward_id,
          title: it.reward_title,
          amount: it.unit_amount,
          needsAddress: it.needs_address,
          quantity: it.quantity,
        }))
      : backer.reward_id
      ? [
          {
            rewardId: backer.reward_id,
            title: backer.rewards?.title || "",
            amount: byId.get(backer.reward_id)?.amount ?? 0,
            needsAddress: byId.get(backer.reward_id)?.needs_address ?? false,
            quantity: 1,
          },
        ]
      : [];

  for (const p of purchased) {
    const plan =
      (p.rewardId && byId.get(p.rewardId)) ||
      rewards.find((r) => r.title === p.title);

    if (!plan) {
      add(
        `title:${p.title}`,
        { title: p.title, amount: p.amount, needsAddress: p.needsAddress },
        p.quantity,
        true
      );
      continue;
    }

    add(plan.id, fromReward(plan), p.quantity, true);
    for (const r of rewards) {
      if (r.id === plan.id || r.reward_type === "no_reward") continue;
      if (r.amount >= plan.amount) continue;
      add(r.id, fromReward(r), p.quantity, false);
    }
  }

  return [...lines.values()].sort((a, b) => b.amount - a.amount);
}
