/**
 * 本文まわりの文字数上限。
 *
 * 画面側にも入力の目安は出しているが、API を直接叩かれると際限なく
 * 書き込めてしまうので、こちらでも受け付ける長さを決めておく。
 * 普通に記事を書くぶんには当たらない余裕をとってある。
 */
export const TEXT_LIMITS = {
  title: 120,
  tagline: 300,
  description: 20000,
  story: 50000,
  updateTitle: 120,
  updateContent: 20000,
} as const;

/** 任意入力の空欄は "" ではなく null で保存する（未入力と空文字を分けない） */
export function blankToNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** 上限を超えている項目があれば、そのまま返せる日本語のメッセージを返す */
export function lengthError(
  fields: { label: string; value: unknown; max: number }[]
): string | null {
  for (const { label, value, max } of fields) {
    if (typeof value === "string" && value.length > max) {
      return `${label}は${max.toLocaleString()}文字以内で入力してください`;
    }
  }
  return null;
}
