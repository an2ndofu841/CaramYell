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
  | "mincho"
  | "antique"
  | "impact";

export interface ThemeFont {
  label: string;
  stack: string;
  /** Google Fonts の family パラメータ。既定で読み込み済みのものは null */
  googleFamily: string | null;
}

export const THEME_FONTS: Record<ThemeFontKey, ThemeFont> = {
  sans: {
    label: "ゴシック（標準）",
    stack: "'Noto Sans JP', sans-serif",
    googleFamily: null,
  },
  rounded: {
    label: "まるゴシック",
    stack: "'Zen Maru Gothic', 'Noto Sans JP', sans-serif",
    googleFamily: null,
  },
  mincho: {
    label: "明朝",
    stack: "'Shippori Mincho', serif",
    googleFamily: "Shippori+Mincho:wght@500;700;800",
  },
  antique: {
    label: "レトロ明朝",
    stack: "'Zen Antique', serif",
    googleFamily: "Zen+Antique",
  },
  impact: {
    label: "インパクト",
    stack: "'Dela Gothic One', 'Noto Sans JP', sans-serif",
    googleFamily: "Dela+Gothic+One",
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
      text: "#EFE6FF",
      textMuted: "#A38FCC",
      accent: "#C9A7FF",
      gradient: "linear-gradient(135deg, #7B3FE4 0%, #B57BFF 55%, #6EE7D2 100%)",
      glow: "rgba(160, 90, 255, 0.45)",
      font: "mincho",
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
      text: "#E6F1FF",
      textMuted: "#8AA6C4",
      accent: "#67D3FF",
      gradient: "linear-gradient(135deg, #2C7BE5 0%, #35C7F0 100%)",
      glow: "rgba(53, 199, 240, 0.38)",
      font: "sans",
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
      textMuted: "#8A7078",
      accent: "#D9538A",
      gradient: "linear-gradient(135deg, #F58BB0 0%, #E36F9B 100%)",
      glow: "rgba(227, 111, 155, 0.30)",
      font: "mincho",
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

/**
 * DB から来た未検証の値を ProjectTheme に整える。
 * 欠けているキーは既定テーマで補うので、後からトークンを増やしても壊れない。
 */
export function resolveTheme(raw: unknown): ProjectTheme {
  if (!raw || typeof raw !== "object") return DEFAULT_THEME;
  const value = raw as Partial<ProjectTheme>;
  const base = value.preset ? themeFromPreset(value.preset) : DEFAULT_THEME;

  const str = (v: unknown, fallback: string) =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;

  return {
    preset: str(value.preset, base.preset),
    bg: str(value.bg, base.bg),
    surface: str(value.surface, base.surface),
    surfaceSoft: str(value.surfaceSoft, base.surfaceSoft),
    border: str(value.border, base.border),
    text: str(value.text, base.text),
    textMuted: str(value.textMuted, base.textMuted),
    accent: str(value.accent, base.accent),
    gradient: str(value.gradient, base.gradient),
    glow: str(value.glow, base.glow),
    font: value.font && value.font in THEME_FONTS ? value.font : base.font,
    radius: str(value.radius, base.radius),
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

/** 見出しフォントの追加読み込みが必要な場合の Google Fonts URL */
export function themeFontHref(theme: ProjectTheme): string | null {
  const family = THEME_FONTS[theme.font].googleFamily;
  if (!family) return null;
  return `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
}
