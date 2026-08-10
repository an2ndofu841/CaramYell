/**
 * 掲載終了日まわりの時刻の決め方。
 *
 * 入力欄は日付だけ（例: 2026-08-24）を返すが、これをそのまま保存すると
 * DB のタイムゾーン（UTC）で 00:00 と解釈され、日本時間では当日の朝 9 時が
 * 締切になってしまう。掲載者の感覚どおり「その日いっぱい」にしたいので、
 * 日本時間の 23:59:59 を締切として保存する。
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * 日付だけの入力を、その日の日本時間 23:59:59.999 を指す ISO 文字列に変換する。
 * すでに時刻まで含んでいる値はそのまま通す（過去データの再保存で時刻を失わないため）。
 */
export function campaignEndFromInput(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  const m = DATE_ONLY.exec(trimmed);
  if (!m) return trimmed;

  return `${m[1]}-${m[2]}-${m[3]}T23:59:59.999+09:00`;
}

/**
 * 日本時間での「今日から days 日後」を、date 入力に渡せる YYYY-MM-DD で返す。
 * UTC 基準で組み立てると日本の朝 9 時までの間だけ 1 日ずれる。
 */
export function jstDateAfterDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000 + 9 * 3_600_000)
    .toISOString()
    .slice(0, 10);
}

/** 募集期間が終わっているか。end_date 未設定なら終わっていない扱い */
export function isCampaignOver(endDate: string | null | undefined): boolean {
  if (!endDate) return false;
  const end = new Date(endDate).getTime();
  return Number.isFinite(end) && end < Date.now();
}
