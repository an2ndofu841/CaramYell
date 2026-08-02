/**
 * プロジェクトページのデザインテーマ。
 *
 * テーマは CSS カスタムプロパティとしてページ最上位に流し込まれ、
 * globals.css の `.project-theme` スコープが既存のブランド色クラスを
 * その変数に読み替える。テーマ外の画面は変数が未定義でフォールバックが
 * 効くため、これまでと同じ見た目になる。
 */

export type ThemeFontKey =
  | "sans"
  | "rounded"
  | "modern"
  | "impact"
  | "mincho";

export interface ThemeFont {
  label: string;
  stack: string;
  /** Google Fonts の family パラメータ。既定で読み込み済みのものは null */
  googleFamily: string | null;
  /**
   * 見出しに使う実ウェイト。
   * 書体が持っていないウェイトを指定するとブラウザが合成ボールドで
   * 字画を太らせてしまい、画数の多い漢字が塗り潰れる。読み込んでいる
   * ウェイトの中で一番太いものをここで固定して合成を避ける。
   */
  displayWeight: number;
}

export const THEME_FONTS: Record<ThemeFontKey, ThemeFont> = {
  sans: {
    label: "ゴシック（標準）",
    stack: "'Noto Sans JP', sans-serif",
    googleFamily: null,
    displayWeight: 700,
  },
  rounded: {
    label: "まるゴシック",
    stack: "'Zen Maru Gothic', 'Noto Sans JP', sans-serif",
    googleFamily: null,
    displayWeight: 900,
  },
  modern: {
    label: "モダンゴシック",
    stack: "'Zen Kaku Gothic New', 'Noto Sans JP', sans-serif",
    googleFamily: "Zen+Kaku+Gothic+New:wght@500;700;900",
    displayWeight: 900,
  },
  impact: {
    label: "インパクト（極太・短いタイトル向き）",
    stack: "'Dela Gothic One', 'Noto Sans JP', sans-serif",
    googleFamily: "Dela+Gothic+One",
    // 400 の 1 ウェイトしか無い書体。太字合成させると漢字が潰れる
    displayWeight: 400,
  },
  mincho: {
    label: "明朝",
    stack: "'Shippori Mincho', serif",
    googleFamily: "Shippori+Mincho:wght@500;700;800",
    displayWeight: 800,
  },
};

export interface ProjectTheme {
  /** 元にしたテンプレート ID（個別調整後もどれベースか分かるように保持） */
  preset: string;
  /** ページ全体の背景。グラデーションも可 */
  bg: string;
  /** カード・パネルの背景 */
  surface: string;
  /** カード内側の淡いブロック（支援者数などの小箱） */
  surfaceSoft: string;
  /** 罫線・カードの枠 */
  border: string;
  /** 本文の色 */
  text: string;
  /** 補足テキストの色 */
  textMuted: string;
  /** 金額やリンクなどの強調色 */
  accent: string;
  /** ボタン・タブ・進捗バーのグラデーション */
  gradient: string;
  /** 影・グローの色 */
  glow: string;
  /** 見出しのフォント */
  font: ThemeFontKey;
  /** カードの角丸 */
  radius: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: Omit<ProjectTheme, "preset">;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "caramel",
    name: "キャラメル",
    description: "CaramYell 標準。やわらかく明るい、誰にでも合う配色。",
    theme: {
      bg: "#FFFBF5",
      surface: "#FFFFFF",
      surfaceSoft: "#FFF8F0",
      border: "#FFEFD6",
      text: "#1F2937",
      textMuted: "#6B7280",
      accent: "#C96A1B",
      gradient: "linear-gradient(135deg, #F2807B 0%, #E8842C 60%, #F5A34B 100%)",
      glow: "rgba(232, 132, 44, 0.35)",
      font: "sans",
      radius: "1.5rem",
    },
  },
  {
    id: "ghost-purple",
    name: "ゴーストパープル",
    description:
      "闇夜に浮かぶ霊魂の紫と、揺らめくエクトプラズムの碧。ネクロマンサー系アイドル向け。",
    theme: {
      bg: "radial-gradient(120% 85% at 50% -10%, #34155B 0%, #1B0C33 45%, #0A0513 100%)",
      surface: "rgba(40, 21, 68, 0.72)",
      surfaceSoft: "rgba(150, 100, 235, 0.12)",
      border: "rgba(178, 132, 255, 0.24)",
      text: "#F3EDFF",
      textMuted: "#BCACDE",
      // 背景と同系の紫だと金額が沈むので、強調色だけ補色寄りの碧にして浮かせる
      accent: "#7BF0DA",
      gradient: "linear-gradient(135deg, #6D28D9 0%, #A855F7 70%, #3FC7B4 100%)",
      glow: "rgba(160, 90, 255, 0.45)",
      // 装飾書体はタイトルの漢字が読みにくくなるので、世界観は配色で作り
      // 見出しの書体は既定と同じ標準ゴシックに揃える
      font: "sans",
      radius: "1.25rem",
    },
  },
  {
    id: "midnight",
    name: "ミッドナイト",
    description: "深い藍色にシアンの光。テック・ガジェット系に。",
    theme: {
      bg: "linear-gradient(180deg, #0C1A2B 0%, #081320 100%)",
      surface: "rgba(18, 38, 60, 0.78)",
      surfaceSoft: "rgba(90, 170, 255, 0.10)",
      border: "rgba(110, 180, 255, 0.20)",
      text: "#E9F3FF",
      textMuted: "#9CB6D2",
      accent: "#7FE0FF",
      gradient: "linear-gradient(135deg, #2C7BE5 0%, #35C7F0 100%)",
      glow: "rgba(53, 199, 240, 0.38)",
      font: "modern",
      radius: "1rem",
    },
  },
  {
    id: "sakura",
    name: "サクラ",
    description: "淡い桜色でやさしく。文化・地域・食のプロジェクトに。",
    theme: {
      bg: "linear-gradient(180deg, #FFF6F8 0%, #FDEFF3 100%)",
      surface: "#FFFFFF",
      surfaceSoft: "#FFF0F4",
      border: "#FADCE4",
      text: "#3B2A31",
      textMuted: "#7E626A",
      accent: "#C93B77",
      gradient: "linear-gradient(135deg, #F58BB0 0%, #E36F9B 100%)",
      glow: "rgba(227, 111, 155, 0.30)",
      font: "modern",
      radius: "1.75rem",
    },
  },
  {
    id: "mono",
    name: "モノクローム",
    description: "余白と字面で見せるミニマル。プロダクト・アート系に。",
    theme: {
      bg: "#F5F5F4",
      surface: "#FFFFFF",
      surfaceSoft: "#F1F1EF",
      border: "#E2E2DE",
      text: "#18181B",
      textMuted: "#71717A",
      accent: "#18181B",
      gradient: "linear-gradient(135deg, #3F3F46 0%, #18181B 100%)",
      glow: "rgba(24, 24, 27, 0.20)",
      font: "sans",
      radius: "0.5rem",
    },
  },
];

export const DEFAULT_PRESET_ID = "caramel";

export function getPreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.id === id);
}

export function themeFromPreset(id: string): ProjectTheme {
  const preset = getPreset(id) ?? THEME_PRESETS[0];
  return { preset: preset.id, ...preset.theme };
}

export const DEFAULT_THEME: ProjectTheme = themeFromPreset(DEFAULT_PRESET_ID);

// テーマの値は最終的に CSS カスタムプロパティとして出力され、
// var() で展開された先で宣言の一部になる。検査せずに通すと
// "red; position: fixed; inset: 0" のような文字列で宣言を継ぎ足され、
// 掲載者が自分のページに全画面オーバーレイや外部リクエストを仕込めてしまう。
// そのため受け付ける構文をこの3種類に限定する。

const COLOR_HEX = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const COLOR_FN = /^(?:rgb|rgba|hsl|hsla)\([0-9.,%/\sdeg-]+\)$/i;
const GRADIENT_FN = /^(?:linear|radial|conic)-gradient\(([\s\S]*)\)$/i;
const LENGTH = /^\d+(?:\.\d+)?(?:px|rem|em|%)?$/;

function isSafeColor(value: string): boolean {
  return COLOR_HEX.test(value) || COLOR_FN.test(value);
}

function isSafePaint(value: string): boolean {
  if (isSafeColor(value)) return true;

  const inner = value.match(GRADIENT_FN)?.[1];
  if (inner === undefined) return false;
  // 宣言や関数を継ぎ足す文字が混ざっていたら弾く
  if (/[;{}\\<>"']|url\(|@|expression|image-set/i.test(inner)) return false;

  // 色関数のぶんの括弧しか許さない（対応が取れていなければ外に漏れている）
  let depth = 0;
  for (const ch of inner) {
    if (ch === "(") depth++;
    else if (ch === ")" && --depth < 0) return false;
  }
  return depth === 0;
}

function isSafeRadius(value: string): boolean {
  const parts = value.split(/\s+/);
  return parts.length <= 4 && parts.every((p) => LENGTH.test(p));
}

/**
 * DB から来た未検証の値を ProjectTheme に整える。
 * 欠けているキーは既定テーマで補うので、後からトークンを増やしても壊れない。
 * 構文が怪しい値もここで既定値に落とす。
 */
export function resolveTheme(raw: unknown): ProjectTheme {
  if (!raw || typeof raw !== "object") return DEFAULT_THEME;
  const value = raw as Partial<ProjectTheme>;
  const base =
    typeof value.preset === "string" && getPreset(value.preset)
      ? themeFromPreset(value.preset)
      : DEFAULT_THEME;

  const checked =
    (ok: (v: string) => boolean) => (v: unknown, fallback: string) => {
      const s = typeof v === "string" ? v.trim() : "";
      return s && ok(s) ? s : fallback;
    };
  const color = checked(isSafeColor);
  const paint = checked(isSafePaint);
  const radius = checked(isSafeRadius);

  return {
    preset: base.preset,
    bg: paint(value.bg, base.bg),
    surface: color(value.surface, base.surface),
    surfaceSoft: color(value.surfaceSoft, base.surfaceSoft),
    border: color(value.border, base.border),
    text: color(value.text, base.text),
    textMuted: color(value.textMuted, base.textMuted),
    accent: color(value.accent, base.accent),
    gradient: paint(value.gradient, base.gradient),
    glow: color(value.glow, base.glow),
    font: value.font && value.font in THEME_FONTS ? value.font : base.font,
    radius: radius(value.radius, base.radius),
  };
}

/** テーマを CSS カスタムプロパティに変換する */
export function themeToCssVars(theme: ProjectTheme): React.CSSProperties {
  return {
    "--pt-bg": theme.bg,
    "--pt-surface": theme.surface,
    "--pt-surface-soft": theme.surfaceSoft,
    "--pt-border": theme.border,
    "--pt-text": theme.text,
    "--pt-text-muted": theme.textMuted,
    "--pt-accent": theme.accent,
    "--pt-gradient": theme.gradient,
    "--pt-glow": theme.glow,
    "--pt-font-display": THEME_FONTS[theme.font].stack,
    "--pt-font-display-weight": THEME_FONTS[theme.font].displayWeight,
    "--pt-radius": theme.radius,
  } as React.CSSProperties;
}

/**
 * 暗い背景のテーマかどうか。本文色の明るさで判定する。
 * バッジなど、色相を保ったままだと暗い面から浮いてしまう要素の調整に使う。
 */
export function isDarkTheme(theme: ProjectTheme): boolean {
  const hex = theme.text.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return false;
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // 本文が明るい＝背景が暗い
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColor(input: string): Rgba | null {
  const value = input.trim();

  const hex = value.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hex) {
    const h =
      hex[1].length === 3
        ? hex[1]
            .split("")
            .map((c) => c + c)
            .join("")
        : hex[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }

  const fn = value.match(
    /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+))?\s*\)$/
  );
  if (fn) {
    return {
      r: Number(fn[1]),
      g: Number(fn[2]),
      b: Number(fn[3]),
      a: fn[4] === undefined ? 1 : Number(fn[4]),
    };
  }

  return null;
}

/**
 * グラデーションでも代表的な一色に均す。
 * コントラストの目安を出すためのものなので、色の平均で足りる。
 */
function flattenToSolid(input: string): Rgba | null {
  const direct = parseColor(input);
  if (direct) return direct;

  const found = input.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]*\)/g);
  if (!found?.length) return null;

  const parsed = found
    .map(parseColor)
    .filter((c): c is Rgba => c !== null && c.a > 0);
  if (!parsed.length) return null;

  const avg = (pick: (c: Rgba) => number) =>
    parsed.reduce((sum, c) => sum + pick(c), 0) / parsed.length;
  return { r: avg((c) => c.r), g: avg((c) => c.g), b: avg((c) => c.b), a: 1 };
}

function composite(over: Rgba, under: Rgba): Rgba {
  const a = over.a;
  return {
    r: over.r * a + under.r * (1 - a),
    g: over.g * a + under.g * (1 - a),
    b: over.b * a + under.b * (1 - a),
    a: 1,
  };
}

function relativeLuminance({ r, g, b }: Rgba): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  );
}

function contrastRatio(a: Rgba, b: Rgba): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x
  );
  return (hi + 0.05) / (lo + 0.05);
}

export interface ContrastWarning {
  label: string;
  ratio: number;
}

/**
 * カードの上に載る文字が読みにくくなっていないか調べる。
 * 掲載者が自由に色を変えられるので、金額のような大事な数字が背景に
 * 沈んでいたら気付けるようにするための目安。
 */
export function themeContrastWarnings(theme: ProjectTheme): ContrastWarning[] {
  const pageBg = flattenToSolid(theme.bg);
  const surfaceRaw = parseColor(theme.surface) ?? flattenToSolid(theme.surface);
  if (!pageBg || !surfaceRaw) return [];

  const surface = composite(surfaceRaw, pageBg);

  // 強調色は主に大きな金額に使うので、大きい文字の基準（3:1）で見る
  const checks: { label: string; color: string; min: number }[] = [
    { label: "本文の文字", color: theme.text, min: 4.5 },
    { label: "補足の文字", color: theme.textMuted, min: 4.5 },
    { label: "強調色（金額など）", color: theme.accent, min: 3 },
  ];

  return checks.flatMap(({ label, color, min }) => {
    const fg = parseColor(color);
    if (!fg) return [];
    const ratio = contrastRatio(composite(fg, surface), surface);
    return ratio < min ? [{ label, ratio }] : [];
  });
}

/** 見出しフォントの追加読み込みが必要な場合の Google Fonts URL */
export function themeFontHref(theme: ProjectTheme): string | null {
  const family = THEME_FONTS[theme.font].googleFamily;
  if (!family) return null;
  return `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
}
