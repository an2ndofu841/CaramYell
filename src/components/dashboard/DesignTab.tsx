"use client";

import { useMemo, useState } from "react";
import { Palette, RotateCcw, Save, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProjectThemePreview from "@/components/project/ProjectThemePreview";
import {
  DEFAULT_THEME,
  ProjectTheme,
  THEME_FONTS,
  THEME_PRESETS,
  ThemeFontKey,
  resolveTheme,
  themeFromPreset,
} from "@/lib/theme/project-theme";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

interface DesignTabProps {
  project: Project;
  onSaved: () => void;
}

/** グラデーション文字列から色を拾って、カラーピッカーの初期値にする */
function gradientStops(gradient: string): [string, string] {
  const found = gradient.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
  return [found[0] ?? "#F2807B", found[found.length - 1] ?? "#F5A34B"];
}

function buildGradient(from: string, to: string): string {
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}

export default function DesignTab({ project, onSaved }: DesignTabProps) {
  const [theme, setTheme] = useState<ProjectTheme>(() =>
    resolveTheme(project.theme)
  );
  const [saving, setSaving] = useState(false);

  const saved = useMemo(() => resolveTheme(project.theme), [project.theme]);
  const dirty = useMemo(
    () => JSON.stringify(theme) !== JSON.stringify(saved),
    [theme, saved]
  );

  const [gradFrom, gradTo] = gradientStops(theme.gradient);

  const patch = (changes: Partial<ProjectTheme>) =>
    setTheme((prev) => ({ ...prev, ...changes }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (!res.ok) throw new Error();
      onSaved();
      alert("デザインを保存しました");
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

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
                onClick={() => setTheme(themeFromPreset(preset.id))}
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
          実際のページと同じ部品で表示しています。保存するまで公開ページは変わりません。
        </p>
        <ProjectThemePreview
          theme={theme}
          title={project.title}
          tagline={project.tagline}
          imageUrl={project.main_image_url}
          currentAmount={project.current_amount}
          goalAmount={project.goal_amount}
          backerCount={project.backer_count}
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
      </Card>

      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={!dirty}
          icon={<Save size={16} />}
        >
          デザインを保存
        </Button>
        <Button
          variant="ghost"
          onClick={() => setTheme({ ...DEFAULT_THEME })}
          icon={<RotateCcw size={16} />}
        >
          標準デザインに戻す
        </Button>
        {dirty && (
          <span className="text-sm text-gray-500">未保存の変更があります</span>
        )}
      </div>
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
