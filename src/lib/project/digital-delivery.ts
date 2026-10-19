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
  /** 宛名に使う名前（合計額が最も多いお名前。同額なら新しい方）。未入力なら空文字 */
  name: string;
  /** 1通にまとめた支援。複数あっても送るのは1通だけ */
  backerIds: string[];
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

  const groups = new Map<string, { backers: Backer[] }>();
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
    const group = groups.get(key) ?? { backers: [] };
    group.backers.push(b);
    groups.set(key, group);
  }

  const recipients = [...groups.entries()].map(([email, group]): DigitalRecipient => {
    const byName = new Map<string, { total: number; latest: string }>();
    for (const b of group.backers) {
      const name = b.guest_nickname?.trim();
      if (!name) continue;
      const entry = byName.get(name) ?? { total: 0, latest: "" };
      entry.total += b.amount || 0;
      if (b.created_at > entry.latest) entry.latest = b.created_at;
      byName.set(name, entry);
    }
    const name =
      [...byName.entries()].sort(
        ([, a], [, b]) => b.total - a.total || b.latest.localeCompare(a.latest)
      )[0]?.[0] ?? "";
    const sentTimes = group.backers.map((b) => sentAtByBacker.get(b.id));
    const allSent = sentTimes.every(Boolean);
    return {
      email,
      name,
      backerIds: group.backers.map((b) => b.id),
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
