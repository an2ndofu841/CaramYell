"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface ProgressMarker {
  /** バー上の位置（0〜100%） */
  position: number;
  /** 目標名などのラベル（バー下に表示） */
  label?: string;
  /** 達成済みかどうか */
  reached?: boolean;
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
    candy: "linear-gradient(90deg, #F2807B, #F5A34B)",
    caramel: "linear-gradient(90deg, #F47B0A, #FF9A2E)",
    mint: "linear-gradient(90deg, #8FD4C4, #A8D8CB)",
  };

  const clamp = (n: number, min = 0, max = 100) =>
    Math.min(Math.max(n, min), max);

  const hasLabels = !!markers?.some((m) => m.label);

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

        {/* 段階目標の位置マーカー（縦線） */}
        {markers?.map((m, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${clamp(m.position)}%` }}
            aria-hidden
          >
            <div
              className={cn(
                "w-[3px] h-3.5 rounded-full ring-2 ring-white shadow-sm",
                m.reached ? "bg-green-500" : "bg-caramel-400"
              )}
            />
          </div>
        ))}
      </div>

      {/* マーカーのラベル */}
      {hasLabels && (
        <div className="relative h-4 mt-1">
          {markers?.map((m, i) =>
            m.label ? (
              <span
                key={i}
                className={cn(
                  "absolute -translate-x-1/2 whitespace-nowrap text-[10px] font-bold",
                  m.reached ? "text-green-600" : "text-gray-400"
                )}
                style={{ left: `${clamp(m.position, 6, 94)}%` }}
              >
                {m.label}
              </span>
            ) : null
          )}
        </div>
      )}

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
