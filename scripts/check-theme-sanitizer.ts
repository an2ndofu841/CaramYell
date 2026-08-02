import { resolveTheme, DEFAULT_THEME } from "../src/lib/theme/project-theme";

const attacks: Record<string, unknown>[] = [
  { preset: "caramel", bg: "red; position: fixed; inset: 0; z-index: 99999" },
  { preset: "caramel", bg: "#fff; background-image: url(https://evil.example/x)" },
  { preset: "caramel", glow: "rgba(0,0,0,.3); content: url(https://evil.example/y)" },
  { preset: "caramel", gradient: "linear-gradient(red); position: fixed; inset: 0" },
  { preset: "caramel", gradient: "linear-gradient(90deg, red, url(https://evil.example/z))" },
  { preset: "caramel", accent: "expression(alert(1))" },
  { preset: "caramel", radius: "1rem; display: none" },
  { preset: "caramel", text: '#000" onload="alert(1)' },
];

const legit: Record<string, unknown>[] = [
  { preset: "ghost-purple" },
  {
    preset: "caramel",
    bg: "radial-gradient(120% 85% at 50% -10%, #34155B 0%, #1B0C33 45%, #0A0513 100%)",
    gradient: "linear-gradient(135deg, #6D28D9 0%, #A855F7 70%, #3FC7B4 100%)",
    glow: "rgba(160, 90, 255, 0.45)",
    accent: "#C96A1B",
    radius: "1.25rem",
  },
  { preset: "caramel", bg: "#FFF", radius: "8px", glow: "hsl(210 40% 50% / 0.4)" },
  // 実際に本番に保存されているテーマ
  {
    bg: "radial-gradient(120% 85% at 50% -10%, #34155B 0%, #1B0C33 45%, #0A0513 100%)",
    font: "sans",
    glow: "rgba(160, 90, 255, 0.45)",
    text: "#F3EDFF",
    accent: "#7BF0DA",
    border: "rgba(178, 132, 255, 0.24)",
    preset: "ghost-purple",
    radius: "1.25rem",
    surface: "rgba(40, 21, 68, 0.72)",
    gradient: "linear-gradient(135deg, #6D28D9 0%, #A855F7 70%, #3FC7B4 100%)",
    textMuted: "#BCACDE",
    surfaceSoft: "rgba(150, 100, 235, 0.12)",
  },
];

let failed = 0;

for (const raw of attacks) {
  const resolved = resolveTheme(raw) as unknown as Record<string, string>;
  for (const [key, value] of Object.entries(raw)) {
    if (key === "preset") continue;
    if (resolved[key] === value) {
      console.error(`NG 通ってしまった: ${key} = ${JSON.stringify(value)}`);
      failed++;
    }
  }
}

for (const raw of legit) {
  const resolved = resolveTheme(raw) as unknown as Record<string, string>;
  for (const [key, value] of Object.entries(raw)) {
    if (key === "preset") continue;
    if (resolved[key] !== value) {
      console.error(
        `NG 正当な値が落ちた: ${key} = ${JSON.stringify(value)} -> ${JSON.stringify(resolved[key])}`
      );
      failed++;
    }
  }
}

const fallback = resolveTheme({ preset: "caramel", bg: "javascript:alert(1)" });
if (fallback.bg !== DEFAULT_THEME.bg) {
  console.error(`NG 既定値に戻っていない: ${fallback.bg}`);
  failed++;
}

console.log(failed === 0 ? "OK: すべて期待どおり" : `NG: ${failed} 件`);
process.exit(failed === 0 ? 0 : 1);
