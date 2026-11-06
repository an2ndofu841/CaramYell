/**
 * 日程調整の日時は日本時間で扱う。
 * 入力欄（datetime-local）は「2026-11-20T14:00」のようにタイムゾーンなしで返すので、
 * 日本時間として ISO 文字列に直してから保存する。
 */

const LOCAL_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const TZ = "Asia/Tokyo";

/** datetime-local の値を日本時間の ISO 文字列にする。形が違えば null */
export function jstInputToIso(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = LOCAL_INPUT.exec(value.trim());
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+09:00`;
  return Number.isFinite(new Date(iso).getTime()) ? iso : null;
}

/** ISO 文字列を datetime-local に入れられる日本時間の値にする */
export function isoToJstInput(iso: string): string {
  return new Date(new Date(iso).getTime() + 9 * 3_600_000).toISOString().slice(0, 16);
}

const dateFmt = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
});
const timeFmt = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});

/** 「2026年11月20日(金)」 */
export function formatJstDate(iso: string): string {
  const parts = Object.fromEntries(
    dateFmt.formatToParts(new Date(iso)).map((p) => [p.type, p.value])
  );
  return `${parts.year}年${parts.month}月${parts.day}日(${parts.weekday})`;
}

/** 「14:00」 */
export function formatJstTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

/** 「2026年11月20日(金) 14:00〜15:00」。所要時間が無ければ開始時刻だけ */
export function formatSlotTime(startsAt: string, durationMinutes?: number | null): string {
  const start = `${formatJstDate(startsAt)} ${formatJstTime(startsAt)}`;
  if (!durationMinutes) return `${start}〜`;
  const end = new Date(new Date(startsAt).getTime() + durationMinutes * 60_000).toISOString();
  return `${start}〜${formatJstTime(end)}`;
}

/** 「11月20日(金) 23:59まで」のような締切表示 */
export function formatDeadline(iso: string): string {
  return `${formatJstDate(iso)} ${formatJstTime(iso)}まで`;
}

/** 日本時間の日付キー（枠を日ごとにまとめる用） */
export function jstDateKey(iso: string): string {
  return isoToJstInput(iso).slice(0, 10);
}
