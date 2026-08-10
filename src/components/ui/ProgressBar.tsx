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
}

export default function ProgressBar({
  percentage,
  className,
  animated = true,
  showLabel = false,
  color = "candy",
  markers,
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setWidth(Math.min(percentage, 100)), 100);
      return () => clearTimeout(timer);
    } else {
      setWidth(Math.min(percentage, 100));
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
