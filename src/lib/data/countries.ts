/**
 * 配送先の国と、国ごとの住所入力フォーマット。
 * DB(JSONB)のキーは共通（postal_code / prefecture / city / address_line1 /
 * address_line2 / recipient_name / country）で、ラベルと並び順・必須項目だけを
 * 国ごとに切り替える。prefecture は州・省・County なども兼ねる。
 */

export type AddressFieldKey =
  | "postal_code"
  | "prefecture"
  | "city"
  | "address_line1"
  | "address_line2";

export interface AddressField {
  key: AddressFieldKey;
  label: string;
  placeholder?: string;
  required?: boolean;
  /** 郵便番号から住所を自動補完する（日本のみ対応） */
  lookup?: boolean;
}

export interface CountryAddressFormat {
  code: string;
  /** 現地表記（その国の言葉での国名）。支援者が自国を見つけられるよう主表示に使う */
  name: string;
  nameJa: string;
  nameEn: string;
  flag: string;
  /** 上から表示する順序 */
  fields: AddressField[];
}

export const COUNTRIES: CountryAddressFormat[] = [
  {
    code: "JP",
    name: "日本",
    nameJa: "日本",
    nameEn: "Japan",
    flag: "🇯🇵",
    fields: [
      { key: "postal_code", label: "郵便番号", placeholder: "123-4567", required: true, lookup: true },
      { key: "prefecture", label: "都道府県", placeholder: "東京都", required: true },
      { key: "city", label: "市区町村・町域", placeholder: "渋谷区渋谷", required: true },
      { key: "address_line1", label: "番地・建物名", placeholder: "1-2-3 カラメルビル101", required: true },
    ],
  },
  {
    code: "US",
    name: "United States",
    nameJa: "アメリカ合衆国",
    nameEn: "United States",
    flag: "🇺🇸",
    fields: [
      { key: "address_line1", label: "Street address", placeholder: "1600 Amphitheatre Pkwy", required: true },
      { key: "address_line2", label: "Apt / Suite（任意）", placeholder: "Apt 101" },
      { key: "city", label: "City", placeholder: "Mountain View", required: true },
      { key: "prefecture", label: "State", placeholder: "CA", required: true },
      { key: "postal_code", label: "ZIP code", placeholder: "94043", required: true },
    ],
  },
  {
    code: "CA",
    name: "Canada",
    nameJa: "カナダ",
    nameEn: "Canada",
    flag: "🇨🇦",
    fields: [
      { key: "address_line1", label: "Street address", placeholder: "123 Main St", required: true },
      { key: "address_line2", label: "Unit（任意）", placeholder: "Unit 4" },
      { key: "city", label: "City", placeholder: "Toronto", required: true },
      { key: "prefecture", label: "Province", placeholder: "ON", required: true },
      { key: "postal_code", label: "Postal code", placeholder: "M5H 2N2", required: true },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    nameJa: "イギリス",
    nameEn: "United Kingdom",
    flag: "🇬🇧",
    fields: [
      { key: "address_line1", label: "Address line 1", placeholder: "10 Downing St", required: true },
      { key: "address_line2", label: "Address line 2（任意）" },
      { key: "city", label: "Town / City", placeholder: "London", required: true },
      { key: "prefecture", label: "County（任意）", placeholder: "Greater London" },
      { key: "postal_code", label: "Postcode", placeholder: "SW1A 2AA", required: true },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    nameJa: "オーストラリア",
    nameEn: "Australia",
    flag: "🇦🇺",
    fields: [
      { key: "address_line1", label: "Street address", placeholder: "123 George St", required: true },
      { key: "address_line2", label: "Unit（任意）" },
      { key: "city", label: "Suburb", placeholder: "Sydney", required: true },
      { key: "prefecture", label: "State", placeholder: "NSW", required: true },
      { key: "postal_code", label: "Postcode", placeholder: "2000", required: true },
    ],
  },
  {
    code: "FR",
    name: "France",
    nameJa: "フランス",
    nameEn: "France",
    flag: "🇫🇷",
    fields: [
      { key: "address_line1", label: "Adresse", placeholder: "12 Rue de Rivoli", required: true },
      { key: "address_line2", label: "Complément（任意）" },
      { key: "postal_code", label: "Code postal", placeholder: "75001", required: true },
      { key: "city", label: "Ville", placeholder: "Paris", required: true },
    ],
  },
  {
    code: "DE",
    name: "Deutschland",
    nameJa: "ドイツ",
    nameEn: "Germany",
    flag: "🇩🇪",
    fields: [
      { key: "address_line1", label: "Straße und Hausnummer", placeholder: "Musterstraße 1", required: true },
      { key: "address_line2", label: "Adresszusatz（任意）" },
      { key: "postal_code", label: "PLZ", placeholder: "10115", required: true },
      { key: "city", label: "Stadt", placeholder: "Berlin", required: true },
    ],
  },
  {
    code: "KR",
    name: "대한민국",
    nameJa: "韓国",
    nameEn: "South Korea",
    flag: "🇰🇷",
    fields: [
      { key: "postal_code", label: "우편번호 / 郵便番号", placeholder: "06236", required: true },
      { key: "prefecture", label: "시·도 / 特別市・道", placeholder: "서울특별시", required: true },
      { key: "city", label: "시·군·구 / 市郡区", placeholder: "강남구", required: true },
      { key: "address_line1", label: "상세주소 / 詳細住所", placeholder: "테헤란로 1길 1", required: true },
    ],
  },
  {
    code: "TW",
    name: "台灣",
    nameJa: "台湾",
    nameEn: "Taiwan",
    flag: "🇹🇼",
    fields: [
      { key: "postal_code", label: "郵遞區號", placeholder: "100", required: true },
      { key: "prefecture", label: "縣市", placeholder: "台北市", required: true },
      { key: "city", label: "鄉鎮市區", placeholder: "中正區", required: true },
      { key: "address_line1", label: "詳細地址", placeholder: "重慶南路一段122號", required: true },
    ],
  },
  {
    code: "HK",
    name: "香港",
    nameJa: "香港",
    nameEn: "Hong Kong",
    flag: "🇭🇰",
    fields: [
      { key: "address_line1", label: "Address", placeholder: "1 Connaught Rd Central", required: true },
      { key: "address_line2", label: "Building / Floor（任意）" },
      { key: "city", label: "District", placeholder: "Central", required: true },
      { key: "prefecture", label: "Region", placeholder: "Hong Kong Island", required: true },
    ],
  },
  {
    code: "SG",
    name: "Singapore",
    nameJa: "シンガポール",
    nameEn: "Singapore",
    flag: "🇸🇬",
    fields: [
      { key: "address_line1", label: "Street address", placeholder: "1 Raffles Place", required: true },
      { key: "address_line2", label: "Unit（任意）", placeholder: "#01-01" },
      { key: "postal_code", label: "Postal code", placeholder: "048616", required: true },
    ],
  },
  {
    code: "OTHER",
    name: "その他の国・地域",
    nameJa: "その他の国・地域",
    nameEn: "Other country / region",
    flag: "🌍",
    fields: [
      { key: "address_line1", label: "Address line 1", required: true },
      { key: "address_line2", label: "Address line 2（任意）" },
      { key: "city", label: "City", required: true },
      { key: "prefecture", label: "State / Province / Region（任意）" },
      { key: "postal_code", label: "Postal code（任意）" },
    ],
  },
];

export const DEFAULT_COUNTRY = "JP";

export function getCountryFormat(code?: string | null): CountryAddressFormat {
  return (
    COUNTRIES.find((c) => c.code === code) ||
    COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY)!
  );
}

/** 指定国で必須の住所項目が埋まっているか検証し、不足しているラベルを返す */
export function missingAddressFields(
  countryCode: string | undefined,
  address: Record<string, string | undefined> | null | undefined
): string[] {
  const fmt = getCountryFormat(countryCode);
  if (!address) return fmt.fields.filter((f) => f.required).map((f) => f.label);
  return fmt.fields
    .filter((f) => f.required && !String(address[f.key] || "").trim())
    .map((f) => f.label);
}

/**
 * セレクトに出す国名ラベル。
 * 主表示は現地表記（自国の言葉）にし、閲覧中の言語での呼び方が異なる場合のみ併記する。
 * 例) 日本語表示: "United States（アメリカ合衆国）" / 英語表示: "日本 (Japan)"
 */
export function countryLabel(
  country: CountryAddressFormat,
  locale: "ja" | "en"
): string {
  if (country.code === "OTHER") {
    return locale === "en" ? country.nameEn : country.nameJa;
  }
  const localized = locale === "en" ? country.nameEn : country.nameJa;
  if (localized === country.name) return country.name;
  return locale === "en"
    ? `${country.name} (${localized})`
    : `${country.name}（${localized}）`;
}
