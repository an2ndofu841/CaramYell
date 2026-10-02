import type { Backer } from "@/types";

export interface NameCredit {
  key: string;
  /** 最新の支援で入力された表記。未入力なら空文字 */
  name: string;
  /** 全角/半角などの違いで同じ名前と見なした別の表記 */
  otherNames: string[];
  total: number;
  count: number;
  /** 合算した支援のメールアドレスの種類数。2以上なら別アドレスを名前でつないでいる */
  emailCount: number;
  /** 同じメールアドレス・アカウントから別の名前で支援している名義 */
  relatedNames: string[];
  firstBackedAt: string;
}

export interface NameCreditSummary {
  credits: NameCredit[];
  /** 匿名を選んだため名前に含めなかった支援の件数 */
  anonymousCount: number;
}

const normalize = (s: string) => s.normalize("NFKC").trim().toLowerCase();

/**
 * 掲載されるのは名前なので、名前が同じ支援を1人にまとめる。
 * 同じアカウントでも名前が違えば別の名義として残す（友人の分をまとめて払う等）。
 * 名前未入力の支援だけはメール・アカウントでまとめる。
 */
function creditKey(b: Backer): string {
  if (b.guest_nickname?.trim()) return `name:${normalize(b.guest_nickname)}`;
  if (b.guest_email?.trim()) return `email:${normalize(b.guest_email)}`;
  if (b.user_id) return `user:${b.user_id}`;
  return `backer:${b.id}`;
}

function contactKeys(b: Backer): string[] {
  const keys: string[] = [];
  if (b.user_id) keys.push(`user:${b.user_id}`);
  if (b.guest_email?.trim()) keys.push(`email:${normalize(b.guest_email)}`);
  return keys;
}

/**
 * フラスタ等の名前掲載用に、支払済みの支援を名前ごとに合算して
 * 合計額の多い順に並べる。同額なら先に支援した人を上にする。
 *
 * 匿名で応援した支援は「名前を出さない」意思表示なので、名前にも合計額にも含めない。
 */
export function buildNameCredits(backers: Backer[]): NameCreditSummary {
  const byCredit = new Map<string, Backer[]>();
  let anonymousCount = 0;

  for (const b of backers) {
    if (b.status !== "paid") continue;
    if (b.is_anonymous) {
      anonymousCount++;
      continue;
    }
    const key = creditKey(b);
    const list = byCredit.get(key);
    if (list) list.push(b);
    else byCredit.set(key, [b]);
  }

  const creditsByContact = new Map<string, Set<string>>();
  for (const [key, list] of byCredit) {
    for (const b of list) {
      for (const contact of contactKeys(b)) {
        const set = creditsByContact.get(contact) ?? new Set<string>();
        set.add(key);
        creditsByContact.set(contact, set);
      }
    }
  }

  const displayName = new Map<string, string>();
  const entries = [...byCredit.entries()].map(([key, list]) => {
    const newestFirst = [...list].sort(
      (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
    );
    const names = [
      ...new Set(newestFirst.map((b) => b.guest_nickname?.trim() || "").filter(Boolean)),
    ];
    displayName.set(key, names[0] || "");
    return { key, list, newestFirst, names };
  });

  const credits: NameCredit[] = entries.map(({ key, list, newestFirst, names }) => {
    const emails = new Set(
      list.flatMap((b) => (b.guest_email?.trim() ? [normalize(b.guest_email)] : []))
    );
    const related = new Set<string>();
    for (const b of list) {
      for (const contact of contactKeys(b)) {
        for (const other of creditsByContact.get(contact) ?? []) {
          const otherName = displayName.get(other);
          if (other !== key && otherName) related.add(otherName);
        }
      }
    }
    return {
      key,
      name: names[0] || "",
      otherNames: names.slice(1),
      total: list.reduce((sum, b) => sum + (b.amount || 0), 0),
      count: list.length,
      emailCount: emails.size,
      relatedNames: [...related],
      firstBackedAt: newestFirst[newestFirst.length - 1].created_at,
    };
  });

  credits.sort(
    (a, b) =>
      b.total - a.total || Date.parse(a.firstBackedAt) - Date.parse(b.firstBackedAt)
  );

  return { credits, anonymousCount };
}
