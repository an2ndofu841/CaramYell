"use client";

import { Check, Lock, Flag } from "lucide-react";
import type { ProjectMilestone } from "@/types";
import { formatCurrency } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * 段階的ゴール（ストレッチゴール）の表示。
 * 現在の支援額に対して、達成済み／未達成の段階をマーカー表示する。
 * 進捗バーは最上位の段階まで伸びる。
 */
export default function MilestonesProgress({
  milestones,
  currentAmount,
}: {
  milestones: ProjectMilestone[];
  currentAmount: number;
}) {
  const sorted = [...milestones].sort((a, b) => a.amount - b.amount);
  if (sorted.length === 0) return null;

  const topAmount = sorted[sorted.length - 1].amount;
  const overallPct = Math.min(
    Math.round((currentAmount / topAmount) * 100),
    100
  );
  const achievedCount = sorted.filter((m) => currentAmount >= m.amount).length;
  const nextMilestone = sorted.find((m) => currentAmount < m.amount);

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
          <Flag size={16} className="text-caramel-500" />
          段階ゴール
        </h3>
        <span className="text-xs font-bold text-caramel-500">
          {achievedCount} / {sorted.length} 達成
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        達成した段階まで実施します
      </p>

      <ProgressBar
        percentage={overallPct}
        markers={sorted
          .filter((m) => m.amount < topAmount)
          .map((m) => ({
            position: (m.amount / topAmount) * 100,
            reached: currentAmount >= m.amount,
          }))}
        className="mb-1"
      />
      <div className="flex justify-between text-xs text-gray-400 mb-4">
        <span>
          <span className="font-bold text-caramel-600">
            {formatCurrency(currentAmount)}
          </span>
        </span>
        <span>最終目標 {formatCurrency(topAmount)}</span>
      </div>

      <ol className="space-y-2.5">
        {sorted.map((m) => {
          const achieved = currentAmount >= m.amount;
          const isNext = nextMilestone?.id === m.id;
          const remaining = m.amount - currentAmount;
          return (
            <li
              key={m.id}
              className={cn(
                "flex items-start gap-3 p-2.5 rounded-2xl border-2 transition-colors",
                achieved
                  ? "border-transparent bg-green-50"
                  : isNext
                  ? "border-caramel-200 bg-caramel-50"
                  : "border-caramel-100 bg-white"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  achieved ? "text-white" : "text-gray-400 bg-caramel-100"
                )}
                style={
                  achieved
                    ? { background: "linear-gradient(135deg, #34a853, #8FD4C4)" }
                    : {}
                }
              >
                {achieved ? <Check size={15} /> : <Lock size={13} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "font-bold text-sm truncate",
                      achieved ? "text-green-700" : "text-gray-700"
                    )}
                  >
                    {m.title}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold flex-shrink-0",
                      achieved ? "text-green-600" : "text-caramel-500"
                    )}
                  >
                    {formatCurrency(m.amount)}
                  </span>
                </div>
                {m.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {m.description}
                  </p>
                )}
                {achieved ? (
                  <p className="text-xs text-green-600 font-semibold mt-0.5">
                    🎉 達成しました！
                  </p>
                ) : isNext ? (
                  <p className="text-xs text-caramel-600 font-semibold mt-0.5">
                    あと {formatCurrency(remaining)} で達成
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
