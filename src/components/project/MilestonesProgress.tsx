"use client";

import { Check, Lock, Flag, Sparkles } from "lucide-react";
import type { ProjectMilestone } from "@/types";
import { formatCurrency } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/LocaleProvider";
import { nextUnreached, splitMilestones } from "@/lib/project/goals";

/**
 * 段階的ゴール（ストレッチゴール）の表示。
 * 現在の支援額に対して、達成済み／未達成の段階をマーカー表示する。
 * 進捗バーは最上位の段階（最終目標）まで伸びる。
 *
 * ネクストゴール（is_stretch）は最終目標の分母に入れず、下に別枠で出す。
 * 掲載中に足しても、上の達成率・達成表示は一切動かない。
 */
export default function MilestonesProgress({
  milestones,
  currentAmount,
}: {
  milestones: ProjectMilestone[];
  currentAmount: number;
}) {
  const t = useT();
  const { base: sorted, stretch } = splitMilestones(milestones);
  if (sorted.length === 0 && stretch.length === 0) return null;

  const topAmount = sorted.length > 0 ? sorted[sorted.length - 1].amount : 0;
  const overallPct =
    topAmount > 0
      ? Math.min(Math.round((currentAmount / topAmount) * 100), 100)
      : 0;
  const achievedCount = sorted.filter((m) => currentAmount >= m.amount).length;
  const nextMilestone = nextUnreached(sorted, currentAmount);

  // ネクストゴール側。バーはネクストゴールの最大額を分母にして、最終目標の位置も
  // 到達済みマーカーとして載せる（「ここまでは達成済み」が一目で分かるように）
  const stretchTop = stretch.length > 0 ? stretch[stretch.length - 1].amount : 0;
  const stretchPct =
    stretchTop > 0
      ? Math.min(Math.round((currentAmount / stretchTop) * 100), 100)
      : 0;
  const stretchAchievedCount = stretch.filter(
    (m) => currentAmount >= m.amount
  ).length;
  const nextStretch = nextUnreached(stretch, currentAmount);

  return (
    <Card>
      {sorted.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
              <Flag size={16} className="text-caramel-500" />
              {t.detail.milestones}
            </h3>
            <span className="text-xs font-bold text-caramel-500">
              {achievedCount} / {sorted.length} {t.detail.milestonesAchieved}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            {t.detail.milestonesNote}
          </p>

          <ProgressBar
            percentage={overallPct}
            markers={sorted.map((m) => ({
              position: (m.amount / topAmount) * 100,
              reached: currentAmount >= m.amount,
              final: m.amount >= topAmount,
            }))}
            className="mb-1"
          />
          <div className="flex justify-between text-xs text-gray-400 mb-4">
            <span>
              <span className="font-bold text-caramel-600">
                {formatCurrency(currentAmount)}
              </span>
            </span>
            <span>
              {t.common.finalGoal}{" "}
              <span className="font-bold text-gray-600">
                {formatCurrency(topAmount)}
              </span>
            </span>
          </div>

          <ol className="space-y-2.5">
            {sorted.map((m) => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                achieved={currentAmount >= m.amount}
                isNext={nextMilestone?.id === m.id}
                remaining={m.amount - currentAmount}
              />
            ))}
          </ol>
        </>
      )}

      {stretch.length > 0 && (
        <div
          className={cn(
            sorted.length > 0 && "mt-5 pt-4 border-t border-dashed border-caramel-100"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
              <Sparkles size={16} className="text-candy-pink" />
              {t.detail.stretchGoals}
            </h3>
            <span className="text-xs font-bold text-candy-pink">
              {stretchAchievedCount} / {stretch.length}{" "}
              {t.detail.milestonesAchieved}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            {t.detail.stretchGoalsNote}
          </p>

          <ProgressBar
            percentage={stretchPct}
            markers={[
              ...(topAmount > 0
                ? [
                    {
                      position: (topAmount / stretchTop) * 100,
                      reached: currentAmount >= topAmount,
                      final: false,
                    },
                  ]
                : []),
              ...stretch.map((m) => ({
                position: (m.amount / stretchTop) * 100,
                reached: currentAmount >= m.amount,
                final: m.amount >= stretchTop,
              })),
            ]}
            className="mb-1"
          />
          <div className="flex justify-between text-xs text-gray-400 mb-4">
            <span>
              <span className="font-bold text-caramel-600">
                {formatCurrency(currentAmount)}
              </span>
            </span>
            <span>
              {t.detail.stretchTop}{" "}
              <span className="font-bold text-gray-600">
                {formatCurrency(stretchTop)}
              </span>
            </span>
          </div>

          <ol className="space-y-2.5">
            {stretch.map((m) => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                achieved={currentAmount >= m.amount}
                isNext={nextStretch?.id === m.id}
                remaining={m.amount - currentAmount}
                stretch
              />
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}

function MilestoneRow({
  milestone: m,
  achieved,
  isNext,
  remaining,
  stretch = false,
}: {
  milestone: ProjectMilestone;
  achieved: boolean;
  isNext: boolean;
  remaining: number;
  /** ネクストゴール。ロック色を候補ピンクに寄せて基本の段階と区別する */
  stretch?: boolean;
}) {
  const t = useT();
  return (
    <li
      className={cn(
        "flex items-start gap-3 p-2.5 rounded-2xl border-2 transition-colors",
        achieved
          ? "border-transparent bg-green-50"
          : isNext
          ? stretch
            ? "border-pink-200 bg-pink-50"
            : "border-caramel-200 bg-caramel-50"
          : "border-caramel-100 bg-white"
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
          achieved
            ? "text-white"
            : stretch
            ? "text-candy-pink bg-pink-100"
            : "text-gray-400 bg-caramel-100"
        )}
        style={
          achieved
            ? { background: "linear-gradient(135deg, #34a853, #8FD4C4)" }
            : {}
        }
      >
        {achieved ? (
          <Check size={15} />
        ) : stretch ? (
          <Sparkles size={13} />
        ) : (
          <Lock size={13} />
        )}
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
              achieved
                ? "text-green-600"
                : stretch
                ? "text-candy-pink"
                : "text-caramel-500"
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
            {t.detail.reachedLabel}
          </p>
        ) : isNext ? (
          <p
            className={cn(
              "text-xs font-semibold mt-0.5",
              stretch ? "text-pink-600" : "text-caramel-600"
            )}
          >
            {formatCurrency(remaining)}
            {t.detail.remainingToReach}
          </p>
        ) : null}
      </div>
    </li>
  );
}
