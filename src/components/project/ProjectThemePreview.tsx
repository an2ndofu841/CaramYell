"use client";

import { Users, Clock, Check } from "lucide-react";
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
            className="relative aspect-square rounded-4xl overflow-hidden bg-caramel-100 shadow-soft-lg"
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

          <div className="flex gap-1 p-1 bg-white rounded-2xl shadow-soft">
            {["ストーリー", "リターン", "活動報告"].map((label, i) => (
              <span
                key={label}
                className={
                  i === 0
                    ? "flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-center text-white"
                    : "flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-center text-gray-500"
                }
                style={i === 0 ? { background: "var(--pt-gradient)" } : undefined}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="bg-white shadow-soft rounded-3xl p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              プロジェクトの本文はこの面と文字色で表示されます。長い文章でも読みやすいか、背景とのコントラストを確かめてください。
            </p>
          </div>

          <div
            className="w-full text-left p-4 rounded-3xl border-2 border-candy-pink shadow-candy"
            style={{ background: "var(--pt-surface-soft)" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-candy-pink bg-candy-pink flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={12} className="text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-caramel-600">
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
          <div className="bg-white shadow-soft rounded-3xl p-5">
            <span className="text-2xl font-bold text-caramel-600">
              {formatCurrency(currentAmount)}
            </span>
            <p className="text-xs text-gray-400 mb-3">
              目標 {formatCurrency(goalAmount)} の
              <span className="font-bold text-caramel-500"> {percentage}%</span>
            </p>

            <div className="progress-bar mb-4">
              <div
                className="progress-bar-fill"
                style={{ width: `${percentage}%`, background: "var(--pt-gradient)" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="text-center p-2 rounded-2xl bg-caramel-50">
                <Users size={14} className="mx-auto mb-1 text-caramel-500" />
                <p className="text-sm font-bold text-gray-800">{backerCount}</p>
                <p className="text-[10px] text-gray-400">応援</p>
              </div>
              <div className="text-center p-2 rounded-2xl bg-caramel-50">
                <Clock size={14} className="mx-auto mb-1 text-caramel-500" />
                <p className="text-sm font-bold text-gray-800">30日</p>
                <p className="text-[10px] text-gray-400">残り</p>
              </div>
            </div>

            <span
              className="block w-full text-center px-5 py-2.5 text-sm rounded-full text-white font-bold"
              style={{
                background: "var(--pt-gradient)",
                boxShadow: "0 4px 20px var(--pt-glow)",
              }}
            >
              このプロジェクトを応援する
            </span>

            <div className="border-t border-caramel-100 mt-4 pt-3">
              <p className="text-[10px] text-gray-400 text-center">
                支援者手数料 0%
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProjectThemeScope>
  );
}
