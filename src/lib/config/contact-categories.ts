/**
 * お問い合わせの種別。
 * フォームの選択肢とサーバー側の検証で同じ定義を使いたいのでここに置く。
 */

export const CONTACT_CATEGORIES = [
  { id: "backing", label: "支援・お支払いについて" },
  { id: "reward", label: "リターンの受け取りについて" },
  { id: "account", label: "アカウントについて（変更・退会など）" },
  { id: "creator", label: "プロジェクトの掲載について" },
  { id: "bug", label: "不具合の報告" },
  { id: "security", label: "脆弱性の報告" },
  { id: "press", label: "取材・提携のご相談" },
  { id: "other", label: "その他" },
] as const;

export type ContactCategoryId = (typeof CONTACT_CATEGORIES)[number]["id"];

export function contactCategoryLabel(id: string): string | null {
  return CONTACT_CATEGORIES.find((c) => c.id === id)?.label ?? null;
}
