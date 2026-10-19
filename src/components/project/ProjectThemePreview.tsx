"use client";

import { Check } from "lucide-react";
import { ProjectTheme } from "@/lib/theme/project-theme";
import ProjectThemeScope from "./ProjectThemeScope";
import { formatCurrency } from "@/lib/utils";

interface ProjectThemePreviewProps {
  theme: ProjectTheme;
  title: string;
  tagline: string;
  imageUrl?: string;
  currentAmount: number;
  goalAmount: number;
  backerCount: number;
}

/**
 * デザインタブ用の縮小プレビュー。
 * 実ページと同じクラス名で組んであるので、テーマの当たり方がそのまま確認できる。
 */
export default function ProjectThemePreview({
  theme,
  title,
  tagline,
  imageUrl,
  currentAmount,
  goalAmount,
  backerCount,
}: ProjectThemePreviewProps) {
  const percentage = goalAmount
    ? Math.min(Math.round((currentAmount / goalAmount) * 100), 100)
    : 0;

  return (
    <ProjectThemeScope theme={theme} className="p-5 rounded-3xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div
            className="relative aspect-square rounded-3xl overflow-hidden bg-caramel-100"
            style={
              imageUrl
                ? {
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          />

          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-tight mb-1">
              {title || "プロジェクトタイトル"}
            </h1>
            <p className="text-sm text-gray-500">
              {tagline || "ここにタグラインが入ります"}
            </p>
          </div>

          {/* 実ページと同じ下線式のタブ。border-candy-pink がテーマの強調色に読み替わる */}
          <div className="flex gap-6 border-b border-line">
            {["ストーリー", "リターン", "活動報告"].map((label, i) => (
              <span
                key={label}
                className={
                  i === 0
                    ? "-mb-px py-2.5 border-b-2 border-candy-pink text-xs font-bold text-gray-800"
                    : "-mb-px py-2.5 border-b-2 border-transparent text-xs font-bold text-gray-500"
                }
              >
                {label}
              </span>
            ))}
          </div>

          <div className="bg-white border border-line rounded-3xl p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              プロジェクトの本文はこの面と文字色で表示されます。長い文章でも読みやすいか、背景とのコントラストを確かめてください。
            </p>
          </div>

          <div
            className="w-full text-left p-4 rounded-3xl border border-candy-pink"
            style={{ background: "var(--pt-surface-soft)" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-candy-pink bg-candy-pink flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={12} className="text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-800 tabular-nums">
                  {formatCurrency(5000)}
                </span>
                <h3 className="font-bold text-gray-800 text-sm">
                  選択中のリターン
                </h3>
                <p className="text-xs text-gray-500">
                  選ばれているリターンの見え方
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-white border border-line rounded-3xl p-5">
            <p className="text-[11px] font-bold text-gray-500 mb-1">現在の支援総額</p>
            <div className="flex items-baseline flex-wrap gap-x-2 mb-1">
              <span className="text-2xl font-bold text-gray-800 tabular-nums">
                {formatCurrency(currentAmount)}
              </span>
              <span className="text-base font-bold text-caramel-600 tabular-nums">
                {percentage}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3 tabular-nums">
              目標金額 {formatCurrency(goalAmount)}
            </p>

            <div className="progress-bar mb-4">
              <div
                className="progress-bar-fill"
                style={{ width: `${percentage}%`, background: "var(--pt-gradient)" }}
              />
            </div>

            <dl className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2 rounded-xl bg-cream-100">
                <dt className="text-[10px] text-gray-500">支援者</dt>
                <dd className="text-sm font-bold text-gray-800 tabular-nums">{backerCount}人</dd>
              </div>
              <div className="p-2 rounded-xl bg-cream-100">
                <dt className="text-[10px] text-gray-500">残り</dt>
                <dd className="text-sm font-bold text-gray-800 tabular-nums">30日</dd>
              </div>
            </dl>

            <span
              className="block w-full text-center px-5 py-2.5 text-sm rounded-lg text-white font-bold"
              style={{
                background: "var(--pt-gradient)",
                boxShadow: "var(--pt-button-shadow, none)",
              }}
            >
              このプロジェクトを応援する
            </span>

            <div className="border-t border-line mt-4 pt-3">
              <p className="text-[10px] text-gray-500 text-center">
                支援者手数料 0%
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProjectThemeScope>
  );
}
