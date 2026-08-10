/**
 * 支援画面などに出す「使える決済手段」の表記。
 *
 * Checkout セッションでは payment_method_types を指定していないので、
 * 実際に何が並ぶかは Stripe ダッシュボードの決済手段設定で決まる。
 * ここはあくまで表示用の文言だが、支援画面・プロジェクト詳細・特商法ページ・
 * FAQ と同じ内容が何度も出てくるため、ずれないよう1か所にまとめている。
 *
 * ダッシュボードで手段を増減したら、ここの enabled も合わせて更新する。
 */

import type { Locale } from "@/lib/i18n/dictionaries";

type PaymentMethodCopy = {
  /** Stripe の payment_method 種別 */
  id: string;
  emoji: string;
  /** バッジ用の短い名前 */
  short: { ja: string; en: string };
  /** 文章中で使う正式な名前 */
  label: { ja: string; en: string };
  /** Stripe ダッシュボードで有効にしてあるか */
  enabled: boolean;
};

const PAYMENT_METHODS: PaymentMethodCopy[] = [
  {
    id: "card",
    emoji: "💳",
    short: { ja: "カード", en: "Card" },
    label: { ja: "クレジットカード", en: "Credit card" },
    enabled: true,
  },
  {
    id: "apple_pay",
    emoji: "🍎",
    short: { ja: "Apple Pay", en: "Apple Pay" },
    label: { ja: "Apple Pay", en: "Apple Pay" },
    enabled: true,
  },
  {
    id: "google_pay",
    emoji: "🔵",
    short: { ja: "Google Pay", en: "Google Pay" },
    label: { ja: "Google Pay", en: "Google Pay" },
    enabled: true,
  },
  {
    id: "paypay",
    emoji: "🅿️",
    short: { ja: "PayPay", en: "PayPay" },
    label: { ja: "PayPay", en: "PayPay" },
    // Stripe ダッシュボードで有効化するまでは案内しない
    enabled: false,
  },
  {
    id: "link",
    emoji: "🔗",
    short: { ja: "Link", en: "Link" },
    label: { ja: "Link", en: "Link" },
    enabled: true,
  },
];

const ENABLED = PAYMENT_METHODS.filter((m) => m.enabled);

/** 「💳 カード」のようなバッジ文字列。支援画面・詳細ページで使う */
export function paymentMethodBadges(locale: Locale = "ja"): string[] {
  return ENABLED.map((m) => `${m.emoji} ${m.short[locale]}`);
}

/**
 * 文章に埋め込む決済手段の羅列。
 * 区切りは日本語なら「・」、英語なら「, 」（最後だけ and）にする。
 */
export function paymentMethodList(locale: Locale = "ja"): string {
  const names = ENABLED.map((m) => m.label[locale]);
  if (locale === "ja") return names.join("・");
  if (names.length < 2) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
