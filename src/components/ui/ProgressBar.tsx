"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface ProgressMarker {
  /** バー上の位置（0〜100%） */
  position: number;
  /** 達成済みかどうか */
  reached?: boolean;
  /** 最終目標。ゴールだと分かるように他の段階より強く出す */
  final?: boolean;
}

interface ProgressBarProps {
  percentage: number;
  className?: string;
  animated?: boolean;
  showLabel?: boolean;
  color?: "candy" | "caramel" | "mint";
  /** 段階目標などの位置マーカー */
  markers?: ProgressMarker[];
  /**
   * 本来のゴールを越えたあとの延長区間（0〜100%）。
   * 最終目標を達成したうえでネクストゴールへ向かっている進捗を、
   * 達成済みの区間とは別の色で描く。from は本来のゴールの位置。
   */
  extension?: { from: number; to: number };
}

export default function ProgressBar({
  percentage,
  className,
  animated = true,
  showLabel = false,
  color = "candy",
  markers,
  extension,
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const [extended, setExtended] = useState(false);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setWidth(Math.min(percentage, 100));
        setExtended(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setWidth(Math.min(percentage, 100));
      setExtended(true);
    }
  }, [percentage, animated]);

  const gradients = {
    // 既定色はプロジェクトページのテーマ変数に追従する
    candy: "var(--pt-gradient, linear-gradient(90deg, #F2807B, #F5A34B))",
    caramel: "linear-gradient(90deg, #F47B0A, #FF9A2E)",
    mint: "linear-gradient(90deg, #8FD4C4, #A8D8CB)",
  };

  const clamp = (n: number, min = 0, max = 100) =>
    Math.min(Math.max(n, min), max);

  const extFrom = extension ? clamp(extension.from) : 0;
  // 達成直後は延長分がごく僅か（数千円）で 1px にも満たないので、
  // 進み始めたことが見えるだけの最小幅は確保する
  const extRaw = extension ? clamp(extension.to) - extFrom : 0;
  const extWidth =
    extRaw > 0 ? Math.min(Math.max(extRaw, 2), 100 - extFrom) : 0;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${width}%`,
              background: gradients[color],
              transition: animated ? "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
          />
          {/* 延長区間。達成済みの区間と見分けがつくよう強調色のストライプにする。
              色はテーマの強調色（--pt-accent）に追従する */}
          {extension && extWidth > 0 && (
            <div
              className="absolute top-0 h-full"
              style={{
                left: `${extFrom}%`,
                width: `${extended ? extWidth : 0}%`,
                background:
                  "repeating-linear-gradient(135deg, var(--pt-accent, #C96A1B) 0 5px, rgba(255,255,255,0.55) 5px 10px)",
                borderRadius: "0 999px 999px 0",
                transition: animated
                  ? "width 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.4s"
                  : "none",
              }}
              aria-hidden
            />
          )}
        </div>

        {/* 段階目標の位置マーカー（縦線）。最終目標はゴール線として長く太くする */}
        {markers?.map((m, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${clamp(m.position)}%` }}
            aria-hidden
          >
            <div
              className={cn(
                // 色はテーマで読み替わる bg-caramel-400 に揃えてあるので、
                // 最終目標であることは線の太さと高さで示す
                "rounded-full ring-2 ring-white shadow-sm",
                m.final ? "w-1 h-5" : "w-[3px] h-3.5",
                m.reached ? "bg-green-500" : "bg-caramel-400"
              )}
            />
          </div>
        ))}
      </div>

      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs font-semibold text-caramel-600">
            {percentage}% 達成
          </span>
        </div>
      )}
    </div>
  );
}
