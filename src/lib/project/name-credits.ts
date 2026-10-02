import type { Backer } from "@/types";

export interface NameCredit {
  key: string;
  /** 最新の支援で入力された名前。未入力なら空文字 */
  name: string;
  /** 同じ人が別の支援で使った別表記（表記ゆれの確認用） */
  otherNames: string[];
  total: number;
  count: number;
  firstBackedAt: string;
}

export interface NameCreditSummary {
  credits: NameCredit[];
  /** 匿名を選んだため名前に含めなかった支援の件数 */
  anonymousCount: number;
}

const normalize = (s: string) => s.normalize("NFKC").trim().toLowerCase();

/**
 * 同一人物の判定。オンライン支援はメールが必須なのでメールでまとめ、
 * メール無しの現地支援だけは名前でまとめる。
 */
function personKey(b: Backer): string {
  if (b.user_id) return `user:${b.user_id}`;
  if (b.guest_email?.trim()) return `email:${normalize(b.guest_email)}`;
  if (b.guest_nickname?.trim()) return `name:${normalize(b.guest_nickname)}`;
  return `backer:${b.id}`;
}

/**
 * フラスタ等の名前掲載用に、支払済みの支援を人ごとに合算して
 * 合計額の多い順に並べる。同額なら先に支援した人を上にする。
 *
 * 匿名で応援した支援は「名前を出さない」意思表示なので、名前にも合計額にも含めない。
 */
export function buildNameCredits(backers: Backer[]): NameCreditSummary {
  const byPerson = new Map<string, Backer[]>();
  let anonymousCount = 0;

  for (const b of backers) {
    if (b.status !== "paid") continue;
    if (b.is_anonymous) {
      anonymousCount++;
      continue;
    }
    const key = personKey(b);
    const list = byPerson.get(key);
    if (list) list.push(b);
    else byPerson.set(key, [b]);
  }

  const credits: NameCredit[] = [...byPerson.entries()].map(([key, list]) => {
    const newestFirst = [...list].sort(
      (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
    );
    const names = [
      ...new Set(
        newestFirst
          .map((b) => b.guest_nickname?.trim() || "")
          .filter(Boolean)
      ),
    ];
    return {
      key,
      name: names[0] || "",
      otherNames: names.slice(1),
      total: list.reduce((sum, b) => sum + (b.amount || 0), 0),
      count: list.length,
      firstBackedAt: newestFirst[newestFirst.length - 1].created_at,
    };
  });

  credits.sort(
    (a, b) =>
      b.total - a.total || Date.parse(a.firstBackedAt) - Date.parse(b.firstBackedAt)
  );

  return { credits, anonymousCount };
}
