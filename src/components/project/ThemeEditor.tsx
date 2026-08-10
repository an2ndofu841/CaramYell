"use client";

import { useMemo } from "react";
import { AlertTriangle, Palette, RotateCcw, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProjectThemePreview from "@/components/project/ProjectThemePreview";
import {
  DEFAULT_THEME,
  ProjectTheme,
  THEME_FONTS,
  THEME_PRESETS,
  ThemeFontKey,
  themeContrastWarnings,
  themeFromPreset,
} from "@/lib/theme/project-theme";
import { cn } from "@/lib/utils";

/** プレビューに映すプロジェクトの中身。作成途中はまだ空のことがある */
export interface ThemePreviewSource {
  title: string;
  tagline: string;
  imageUrl?: string | null;
  currentAmount?: number;
  goalAmount?: number;
  backerCount?: number;
}

interface Props {
  theme: ProjectTheme;
  onChange: (theme: ProjectTheme) => void;
  preview: ThemePreviewSource;
}

/** グラデーション文字列から色を拾って、カラーピッカーの初期値にする */
function gradientStops(gradient: string): [string, string] {
  const found = gradient.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
  return [found[0] ?? "#F2807B", found[found.length - 1] ?? "#F5A34B"];
}

function buildGradient(from: string, to: string): string {
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}

/**
 * テーマの見た目を編集する部分。保存の仕方は使う側で違う
 * （ダッシュボードはその場で保存、作成ウィザードは下書きと一緒に送る）ので、
 * ここは値を受け取って返すだけにしてある。
 */
export default function ThemeEditor({ theme, onChange, preview }: Props) {
  const [gradFrom, gradTo] = gradientStops(theme.gradient);
  const contrastWarnings = useMemo(
    () => themeContrastWarnings(theme),
    [theme]
  );

  const patch = (changes: Partial<ProjectTheme>) =>
    onChange({ ...theme, ...changes });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Palette size={18} className="text-candy-pink" />
              デザインテンプレート
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              まずは雰囲気の近いテンプレートを選び、そのあと下の項目で気になるところだけ調整してください。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEME_PRESETS.map((preset) => {
            const active = theme.preset === preset.id;
            const [from, to] = gradientStops(preset.theme.gradient);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange(themeFromPreset(preset.id))}
                className={cn(
                  "text-left rounded-2xl border-2 overflow-hidden transition-all",
                  active
                    ? "border-candy-pink shadow-candy"
                    : "border-caramel-100 hover:border-caramel-300"
                )}
              >
                <div
                  className="h-20 p-3 flex items-end gap-2"
                  style={{ background: preset.theme.bg }}
                >
                  <span
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    style={{ background: buildGradient(from, to) }}
                  />
                  <span
                    className="flex-1 h-8 rounded-lg"
                    style={{
                      background: preset.theme.surface,
                      border: `1px solid ${preset.theme.border}`,
                    }}
                  />
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-md"
                    style={{
                      color: preset.theme.accent,
                      background: preset.theme.surfaceSoft,
                      fontFamily: THEME_FONTS[preset.theme.font].stack,
                    }}
                  >
                    Aa
                  </span>
                </div>
                <div className="p-3 bg-white">
                  <p className="font-bold text-sm text-gray-800 flex items-center gap-1">
                    {preset.name}
                    {active && (
                      <Sparkles size={13} className="text-candy-pink" />
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-1">プレビュー</h3>
        <p className="text-sm text-gray-500 mb-4">
          実際のページと同じ部品で表示しています。
        </p>

        {contrastWarnings.length > 0 && (
          <div className="mb-4 p-4 rounded-2xl bg-yellow-50 border-2 border-yellow-200">
            <p className="flex items-center gap-2 text-sm font-bold text-yellow-800">
              <AlertTriangle size={15} />
              カードの上で読みにくくなっている色があります
            </p>
            <ul className="mt-2 space-y-1">
              {contrastWarnings.map((w) => (
                <li key={w.label} className="text-sm text-yellow-800">
                  {w.label}（コントラスト比 {w.ratio.toFixed(1)}：1）
                </li>
              ))}
            </ul>
            <p className="text-xs text-yellow-700 mt-2 leading-relaxed">
              金額のような大事な数字が背景に沈んでしまいます。文字は 4.5：1、大きく出る強調色は
              3：1 が目安です。背景と近い色相だと比率が足りていても沈んで見えるので、強調色は思い切って別の色相にすると読みやすくなります。
            </p>
          </div>
        )}

        <ProjectThemePreview
          theme={theme}
          title={preview.title || "プロジェクトのタイトル"}
          tagline={preview.tagline || "ここにキャッチコピーが入ります"}
          imageUrl={preview.imageUrl ?? undefined}
          currentAmount={preview.currentAmount ?? 0}
          goalAmount={preview.goalAmount ?? 0}
          backerCount={preview.backerCount ?? 0}
        />
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-5">個別に調整</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <ColorField
            label="ページの背景"
            hint="グラデーションの CSS も書けます"
            value={theme.bg}
            onChange={(bg) => patch({ bg })}
          />
          <ColorField
            label="カードの背景"
            value={theme.surface}
            onChange={(surface) => patch({ surface })}
          />
          <ColorField
            label="淡いブロックの背景"
            hint="支援者数などの小箱"
            value={theme.surfaceSoft}
            onChange={(surfaceSoft) => patch({ surfaceSoft })}
          />
          <ColorField
            label="罫線・枠"
            value={theme.border}
            onChange={(border) => patch({ border })}
          />
          <ColorField
            label="本文の文字"
            value={theme.text}
            onChange={(text) => patch({ text })}
          />
          <ColorField
            label="補足の文字"
            value={theme.textMuted}
            onChange={(textMuted) => patch({ textMuted })}
          />
          <ColorField
            label="強調色"
            hint="金額やリンクの色"
            value={theme.accent}
            onChange={(accent) => patch({ accent })}
          />
          <ColorField
            label="影・グロー"
            value={theme.glow}
            onChange={(glow) => patch({ glow })}
          />

          <div className="md:col-span-2">
            <p className="text-sm font-bold text-gray-700 mb-2">
              ボタンのグラデーション
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <ColorSwatch
                value={gradFrom}
                onChange={(v) => patch({ gradient: buildGradient(v, gradTo) })}
              />
              <ColorSwatch
                value={gradTo}
                onChange={(v) => patch({ gradient: buildGradient(gradFrom, v) })}
              />
              <span
                className="flex-1 min-w-[160px] h-9 rounded-full"
                style={{ background: theme.gradient }}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">
              見出しのフォント
            </label>
            <select
              value={theme.font}
              onChange={(e) => patch({ font: e.target.value as ThemeFontKey })}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-caramel-100 bg-white text-sm font-medium text-gray-700 focus:border-caramel-300 outline-none"
            >
              {(Object.keys(THEME_FONTS) as ThemeFontKey[]).map((key) => (
                <option key={key} value={key}>
                  {THEME_FONTS[key].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">
              角の丸み
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={40}
                step={2}
                value={parseFloat(theme.radius) * 16 || 0}
                onChange={(e) =>
                  patch({ radius: `${Number(e.target.value) / 16}rem` })
                }
                className="flex-1 accent-candy-pink"
              />
              <span className="text-sm font-semibold text-gray-500 w-16 text-right">
                {Math.round(parseFloat(theme.radius) * 16)}px
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            variant="ghost"
            onClick={() => onChange({ ...DEFAULT_THEME })}
            icon={<RotateCcw size={16} />}
          >
            標準デザインに戻す
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ColorSwatch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // グラデーションや rgba は type="color" で扱えないので、その場合は無地の見本を出す
  const hex = /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : "#ffffff";
  return (
    <label
      className="w-10 h-10 rounded-xl border-2 border-caramel-100 cursor-pointer overflow-hidden flex-shrink-0"
      style={{ background: value }}
    >
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
        className="opacity-0 w-full h-full cursor-pointer"
      />
    </label>
  );
}

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-gray-700 block mb-2">
        {label}
        {hint && (
          <span className="ml-2 text-xs font-medium text-gray-400">{hint}</span>
        )}
      </label>
      <div className="flex items-center gap-2">
        <ColorSwatch value={value} onChange={onChange} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 min-w-0 px-3 py-2 rounded-xl border-2 border-caramel-100 bg-white text-xs font-mono text-gray-700 focus:border-caramel-300 outline-none"
        />
      </div>
    </div>
  );
}
