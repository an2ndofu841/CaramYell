import type { OrganizationType } from "@/types";

/** 掲載申請の「団体の種別」。フォームの選択肢とサーバー側の検証で共有する */
export const ORGANIZATION_TYPES: { id: OrganizationType; label: string }[] = [
  { id: "agency", label: "芸能事務所・プロダクション" },
  { id: "label", label: "レーベル・レコード会社" },
  { id: "management", label: "グループ運営・マネジメント" },
  { id: "venue", label: "ライブハウス・イベント主催" },
  { id: "individual", label: "個人で活動するアーティスト" },
  { id: "other", label: "その他" },
];

export function organizationTypeLabel(id: string): string | null {
  return ORGANIZATION_TYPES.find((t) => t.id === id)?.label ?? null;
}
