import type { Backer, Reward } from "@/types";
import { expandBackerRewards } from "./reward-bundle";

export interface RewardDelivery {
  reward_id: string;
  backer_id: string;
  sent_at: string;
}

/** 1通のメールの宛先。同じアドレスの支援は何回分でも1通にまとめる */
export interface DigitalRecipient {
  email: string;
  /** 宛名に使う名前（最新の支援のお名前）。未入力なら空文字 */
  name: string;
  backerIds: string[];
  /** 受け取る個数（複数回の支援・上位プランに含まれる分を合算） */
  quantity: number;
  /** まとめた支援すべてに送付済みなら、最後に送った日時 */
  sentAt: string | null;
}

export interface DigitalRecipientSummary {
  recipients: DigitalRecipient[];
  /** 受け取る権利はあるがメールアドレスが無い支援（現地の現金支援など） */
  missingEmailCount: number;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isDigitalReward = (r: Pick<Reward, "reward_type">) =>
  r.reward_type === "digital";

/**
 * あるデジタルリターンを受け取る支援者を、メールアドレス単位で集める。
 * 上位プランはそれより安いリターンを含むので、発送管理と同じ展開ルールで数える。
 * 匿名の支援も受け取る権利はあるので含める（匿名は掲載上の扱いに過ぎない）。
 */
export function collectDigitalRecipients(
  backers: readonly Backer[],
  rewards: readonly Reward[],
  rewardId: string,
  deliveries: readonly RewardDelivery[]
): DigitalRecipientSummary {
  const sentAtByBacker = new Map(
    deliveries.filter((d) => d.reward_id === rewardId).map((d) => [d.backer_id, d.sent_at])
  );

  const groups = new Map<string, { backers: Backer[]; quantity: number }>();
  let missingEmailCount = 0;

  for (const b of backers) {
    if (b.status !== "paid") continue;
    const line = expandBackerRewards(b, rewards).find((l) => l.key === rewardId);
    if (!line || line.quantity <= 0) continue;
    const email = b.guest_email?.trim();
    if (!email) {
      missingEmailCount++;
      continue;
    }
    const key = normalizeEmail(email);
    const group = groups.get(key) ?? { backers: [], quantity: 0 };
    group.backers.push(b);
    group.quantity += line.quantity;
    groups.set(key, group);
  }

  const recipients = [...groups.entries()].map(([email, group]): DigitalRecipient => {
    const newestFirst = [...group.backers].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
    const sentTimes = group.backers.map((b) => sentAtByBacker.get(b.id));
    const allSent = sentTimes.every(Boolean);
    return {
      email,
      name: newestFirst.find((b) => b.guest_nickname?.trim())?.guest_nickname?.trim() || "",
      backerIds: group.backers.map((b) => b.id),
      quantity: group.quantity,
      sentAt: allSent
        ? (sentTimes as string[]).reduce((max, t) => (t > max ? t : max))
        : null,
    };
  });

  // 未送付を上に、その中は支援の古い順（先に応援してくれた人から）
  const firstBackedAt = new Map(
    [...groups.entries()].map(([email, g]) => [
      email,
      g.backers.reduce((min, b) => (b.created_at < min ? b.created_at : min), g.backers[0].created_at),
    ])
  );
  recipients.sort(
    (a, b) =>
      Number(Boolean(a.sentAt)) - Number(Boolean(b.sentAt)) ||
      firstBackedAt.get(a.email)!.localeCompare(firstBackedAt.get(b.email)!)
  );

  return { recipients, missingEmailCount };
}
