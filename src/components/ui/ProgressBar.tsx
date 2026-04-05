"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percentage: number;
  className?: string;
  animated?: boolean;
  showLabel?: boolean;
  color?: "candy" | "caramel" | "mint";
}

export default function ProgressBar({
  percentage,
  className,
  animated = true,
  showLabel = false,
  color = "candy",
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
    candy: "linear-gradient(90deg, #FF6B9D, #FFB347)",
    caramel: "linear-gradient(90deg, #F47B0A, #FF9A2E)",
    mint: "linear-gradient(90deg, #4ECDC4, #74C0FC)",
  };

  return (
    <div className={cn("relative", className)}>
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
