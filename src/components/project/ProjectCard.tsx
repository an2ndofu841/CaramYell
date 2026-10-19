"use client";

import { publisherName } from "@/lib/project/publisher";
import Link from "next/link";
import Image from "next/image";
import { Clock, Users } from "lucide-react";
import { Project } from "@/types";
import { calcProjectStats, cn, formatCurrency, formatNumber } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  nextUnreached,
  resolveFinalGoal,
  splitMilestones,
} from "@/lib/project/goals";

interface ProjectCardProps {
  project: Project;
  featured?: boolean;
}

export default function ProjectCard({ project, featured = false }: ProjectCardProps) {
  const { t, pick } = useLocale();
  const stats = calcProjectStats(project);

  // 段階ゴールがある場合は最終目標を基準にする。
  // 第1目標（goal_amount）基準のままだと、まだ上の段階が残っているのに
  // カードだけ「100% 達成！」に見えてしまうため。
  // ネクストゴール（is_stretch）は最終目標のさらに上なので分母には入れない。
  const { base: baseMilestones, stretch: stretchGoals } = splitMilestones(
    project.project_milestones
  );
  const finalGoal = resolveFinalGoal(project.goal_amount, baseMilestones);
  const progressPct = Math.min(
    Math.round((project.current_amount / (finalGoal || 1)) * 100),
    100
  );
  const isFunded = project.current_amount >= finalGoal;
  // 達成したうえで未達のネクストゴールがある＝挑戦中。
  // 「達成！」だけだと終わったと思われてカードを開いてもらえないので、
  // バッジと数字（100% で止めない）とゲージで、まだ続いていることを見せる
  const nextStretch = nextUnreached(stretchGoals, project.current_amount);
  const stretchChallenging = isFunded && !!nextStretch;
  const stretchTop = stretchChallenging
    ? stretchGoals[stretchGoals.length - 1].amount
    : 0;
  const toStretchPos = (amount: number) =>
    stretchTop > 0 ? Math.min((amount / stretchTop) * 100, 100) : 0;
  const uncappedPct = Math.round(
    (project.current_amount / (finalGoal || 1)) * 100
  );

  // NEW: 作成から14日以内
  const isNew =
    Date.now() - new Date(project.created_at).getTime() < 14 * 86400000;
  const ended = stats.days_left <= 0;
  const owner = publisherName(project);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block h-full rounded-xl overflow-hidden bg-white border border-line hover:border-line-strong hover:shadow-soft-lg transition-[box-shadow,border-color] duration-200"
    >
      {/* 画像 */}
      <div className="relative bg-cream-100">
        <div className={cn("relative", featured ? "aspect-[16/9]" : "aspect-[16/10]")}>
          {project.main_image_url ? (
            <Image
              src={project.main_image_url}
              alt={project.title}
              fill
              sizes={featured ? "(max-width: 1024px) 100vw, 800px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-ink-faint">
              CaramYell
            </div>
          )}
        </div>

        {/* 状態ラベル */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {stretchChallenging ? (
            <StatusLabel tone="dark">{t.detail.stretchRibbonTitle}</StatusLabel>
          ) : isFunded ? (
            <StatusLabel tone="success">{t.common.achieved}</StatusLabel>
          ) : ended ? (
            <StatusLabel tone="muted">{t.common.ended}</StatusLabel>
          ) : isNew ? (
            <StatusLabel tone="light">NEW</StatusLabel>
          ) : null}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-5">
        {(owner || project.categories) && (
          <div className="flex items-center gap-2 mb-2 text-xs text-ink-muted min-w-0">
            {owner && <span className="truncate font-medium">{owner}</span>}
            {owner && project.categories && <span aria-hidden className="text-line-strong">/</span>}
            {project.categories && (
              <span className="flex-shrink-0">{pick(project.categories.name_ja, project.categories.name_en)}</span>
            )}
          </div>
        )}

        <h3 className="font-bold text-ink text-[15px] leading-snug mb-4 line-clamp-2 min-h-[2.75em]">
          {pick(project.title, project.title_en)}
        </h3>

        {stretchChallenging ? (
          <ProgressBar
            percentage={toStretchPos(finalGoal)}
            extension={{
              from: toStretchPos(finalGoal),
              to: toStretchPos(project.current_amount),
            }}
            markers={[
              { position: toStretchPos(finalGoal), reached: true, final: true },
            ]}
            className="mb-3"
          />
        ) : (
          <ProgressBar percentage={progressPct} className="mb-3" />
        )}

        <div className="flex items-baseline justify-between gap-3">
          <span className="text-lg font-bold text-ink tabular-nums">
            {formatCurrency(project.current_amount)}
          </span>
          <span className="text-sm font-bold text-caramel-600 tabular-nums">
            {stretchChallenging ? uncappedPct : progressPct}%
          </span>
        </div>
        {stretchChallenging && nextStretch && (
          <p className="mt-1 text-xs text-ink-muted truncate">
            {t.detail.stretchCardRemaining}
            {formatCurrency(nextStretch.amount - project.current_amount)}
          </p>
        )}

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-line text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Users size={13} />
            {formatNumber(project.backer_count)}人
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            {ended ? t.common.ended : `残り${stats.days_left}日`}
          </span>
        </div>
      </div>
    </Link>
  );
}

function StatusLabel({
  tone,
  children,
}: {
  tone: "dark" | "success" | "muted" | "light";
  children: React.ReactNode;
}) {
  const tones = {
    dark: "bg-ink text-white",
    success: "bg-emerald-700 text-white",
    muted: "bg-white/90 text-ink-muted",
    light: "bg-white/90 text-ink",
  };
  return (
    <span className={cn("px-2 py-1 rounded-md text-[11px] font-bold backdrop-blur", tones[tone])}>
      {children}
    </span>
  );
}
