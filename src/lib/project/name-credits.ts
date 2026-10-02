import type { Backer } from "@/types";

export interface NameCredit {
  key: string;
  /** 掲載に使う名前（この人の支援で合計額が最も多い名前）。未入力なら空文字 */
  name: string;
  /** 同じ人の支援で使われた別の名前 */
  otherNames: string[];
  total: number;
  count: number;
  /** 合算した支援のメールアドレスの種類数。2以上なら別アドレスを名前でつないでいる */
  emailCount: number;
  firstBackedAt: string;
}

export interface NameCreditSummary {
  credits: NameCredit[];
  /** 匿名を選んだため名前に含めなかった支援の件数 */
  anonymousCount: number;
}

const normalize = (s: string) => s.normalize("NFKC").trim().toLowerCase();

/** 名前・メール・アカウントのどれかが一致する支援は同じ人と見なす */
function identityKeys(b: Backer): string[] {
  const keys: string[] = [];
  if (b.guest_nickname?.trim()) keys.push(`name:${normalize(b.guest_nickname)}`);
  if (b.guest_email?.trim()) keys.push(`email:${normalize(b.guest_email)}`);
  if (b.user_id) keys.push(`user:${b.user_id}`);
  return keys;
}

/**
 * フラスタ等の名前掲載用に、支払済みの支援を人ごとに合算して
 * 合計額の多い順に並べる。同額なら先に支援した人を上にする。
 *
 * 匿名で応援した支援は「名前を出さない」意思表示なので、名前にも合計額にも含めない。
 */
export function buildNameCredits(backers: Backer[]): NameCreditSummary {
  const paid: Backer[] = [];
  let anonymousCount = 0;
  for (const b of backers) {
    if (b.status !== "paid") continue;
    if (b.is_anonymous) anonymousCount++;
    else paid.push(b);
  }

  const parent = new Map<string, string>();
  const find = (k: string): string => {
    let root = k;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(k, root);
    return root;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));

  for (const b of paid) {
    const keys = [`backer:${b.id}`, ...identityKeys(b)];
    for (const k of keys) if (!parent.has(k)) parent.set(k, k);
    for (const k of keys.slice(1)) union(keys[0], k);
  }

  const groups = new Map<string, Backer[]>();
  for (const b of paid) {
    const root = find(`backer:${b.id}`);
    const list = groups.get(root);
    if (list) list.push(b);
    else groups.set(root, [b]);
  }

  const credits: NameCredit[] = [...groups.entries()].map(([key, list]) => {
    const byName = new Map<string, { name: string; total: number; latest: number }>();
    for (const b of list) {
      const name = b.guest_nickname?.trim();
      if (!name) continue;
      const entry = byName.get(name) ?? { name, total: 0, latest: 0 };
      entry.total += b.amount || 0;
      entry.latest = Math.max(entry.latest, Date.parse(b.created_at));
      byName.set(name, entry);
    }
    const names = [...byName.values()]
      .sort((a, b) => b.total - a.total || b.latest - a.latest)
      .map((n) => n.name);
    const emails = new Set(
      list.flatMap((b) => (b.guest_email?.trim() ? [normalize(b.guest_email)] : []))
    );

    return {
      key,
      name: names[0] || "",
      otherNames: names.slice(1),
      total: list.reduce((sum, b) => sum + (b.amount || 0), 0),
      count: list.length,
      emailCount: emails.size,
      firstBackedAt: list.reduce(
        (min, b) => (Date.parse(b.created_at) < Date.parse(min) ? b.created_at : min),
        list[0].created_at
      ),
    };
  });

  credits.sort(
    (a, b) =>
      b.total - a.total || Date.parse(a.firstBackedAt) - Date.parse(b.firstBackedAt)
  );

  return { credits, anonymousCount };
}
