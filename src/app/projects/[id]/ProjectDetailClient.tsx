"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Share2,
  Clock,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronDown,
  MapPin,
  Package,
  Smartphone,
  Star,
  MessageSquare,
  Globe,
  AtSign,
  Check,
} from "lucide-react";
import { Project, Reward } from "@/types";
import {
  calcProjectStats,
  formatCurrency,
  formatNumber,
  isRewardAvailable,
  timeAgo,
} from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";
import MilestonesProgress from "@/components/project/MilestonesProgress";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Markdown from "@/components/ui/Markdown";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { paymentMethodBadges } from "@/lib/config/payment-methods";
import ProjectThemeScope from "@/components/project/ProjectThemeScope";
import { ProjectTheme, resolveTheme } from "@/lib/theme/project-theme";
import { isCampaignOver } from "@/lib/date/campaign-end";
import {
  nextUnreached,
  resolveFinalGoal,
  splitMilestones,
} from "@/lib/project/goals";

interface ProjectDetailClientProps {
  project: Project;
  isPreview?: boolean;
  /** 管理画面のプレビューで、保存前のテーマを当てるための上書き */
  themeOverride?: ProjectTheme;
}

export default function ProjectDetailClient({
  project,
  isPreview = false,
  themeOverride,
}: ProjectDetailClientProps) {
  const { t, locale, pick } = useLocale();
  const allowComments = project.allow_comments !== false;
  // 締切を過ぎたら決済側で弾かれるので、画面側でも入口を閉じておく
  const isEnded = isCampaignOver(project.end_date);
  const canBack = !isPreview && !isEnded;
  const disabledLabel = isPreview
    ? t.detail.previewDisabled
    : t.detail.endedDisabled;
  // リターンはタブに隠さず本文の下に常時並べるので、タブからは外している
  const tabs = [
    { id: "story", label: t.detail.tabStory },
    { id: "updates", label: t.detail.tabUpdates },
    ...(allowComments ? [{ id: "comments", label: t.detail.tabComments }] : []),
  ];

  const [activeTab, setActiveTab] = useState("story");
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [liked, setLiked] = useState(false);

  // メイン画像を先頭にしたひとつながりの並び。同じURLが両方に入っていても1枚に見せる
  const gallery = useMemo(
    () =>
      Array.from(
        new Set(
          [project.main_image_url, ...(project.images ?? [])].filter(
            (url): url is string => Boolean(url)
          )
        )
      ),
    [project.main_image_url, project.images]
  );
  const [activeImage, setActiveImage] = useState<string | null>(
    gallery[0] ?? null
  );

  const stats = calcProjectStats(project);
  const milestones = project.project_milestones ?? [];
  // ネストした select は並び順を保証しないので新着順に並べ直す
  const updates = [...(project.project_updates ?? [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  // ネクストゴール（is_stretch）は最終目標の分母に入れない。掲載中に足しても
  // 達成率・達成バッジが動かないように、ここで基本の段階と切り分ける
  const { base: sortedMilestones, stretch: stretchGoals } =
    splitMilestones(milestones);
  const hasMilestones = sortedMilestones.length > 0;
  const hasStretch = stretchGoals.length > 0;
  // 段階ゴールがある場合は「最終目標」を基準に進捗を見せる（第1目標達成で満タンに見せない）
  const finalGoal = resolveFinalGoal(project.goal_amount, sortedMilestones);
  const nextMilestone = hasMilestones
    ? nextUnreached(sortedMilestones, project.current_amount)
    : undefined;
  const headlinePct = Math.min(
    Math.round((project.current_amount / finalGoal) * 100),
    100
  );
  const allMilestonesAchieved = hasMilestones && !nextMilestone;
  // 最終目標を越えたあとに見せるプラスアルファ。未達のネクストゴールが無ければ全達成
  const finalGoalReached = hasMilestones
    ? allMilestonesAchieved
    : stats.is_funded;
  const nextStretch = nextUnreached(stretchGoals, project.current_amount);
  // 進捗バー上の段階目標マーカー。名前はバーの下に並べると隣と重なって
  // 読めなくなるので出さず、下の段階ゴール一覧に任せている。
  const milestoneMarkers = hasMilestones
    ? sortedMilestones.map((m) => ({
        position: (m.amount / finalGoal) * 100,
        reached: project.current_amount >= m.amount,
        final: m.amount >= finalGoal,
      }))
    : undefined;

  // 最終目標を達成してネクストゴールがあるときは、ゲージの分母をネクストゴールまで
  // 伸ばす。最終目標までは通常色、その先の進捗は別色（ストライプ）で描き、
  // 「達成して終わり」ではなく「まだ次を目指している」ことが見えるようにする。
  // 達成率の数字（100%）と達成バッジは最終目標基準のまま動かさない。
  const stretchTop = hasStretch
    ? stretchGoals[stretchGoals.length - 1].amount
    : 0;
  const showStretchGauge = hasStretch && finalGoalReached && stretchTop > 0;
  // 未達のネクストゴールがある＝達成したうえで、まだ次に向けて募集している
  const stretchChallenging = showStretchGauge && !!nextStretch;
  // ネクストゴール挑戦中は 100% で止めず、最終目標に対する実際の率（101% など）を
  // 出す。「達成して終わり」ではなく伸び続けていることが数字でも分かる
  const uncappedPct = Math.round((project.current_amount / finalGoal) * 100);
  const toStretchPos = (amount: number) => (amount / stretchTop) * 100;
  const gaugePct = showStretchGauge
    ? toStretchPos(finalGoal)
    : hasMilestones
    ? headlinePct
    : stats.progress_percentage;
  const gaugeExtension = showStretchGauge
    ? {
        from: toStretchPos(finalGoal),
        to: Math.min(toStretchPos(project.current_amount), 100),
      }
    : undefined;
  const gaugeMarkers = showStretchGauge
    ? [
        // 最終目標の位置。基本の段階があればそれぞれの位置も残す
        ...(hasMilestones
          ? sortedMilestones.map((m) => ({
              position: toStretchPos(m.amount),
              reached: true,
              final: m.amount >= finalGoal,
            }))
          : [{ position: toStretchPos(finalGoal), reached: true, final: true }]),
        ...stretchGoals.map((m) => ({
          position: toStretchPos(m.amount),
          reached: project.current_amount >= m.amount,
          final: m.amount >= stretchTop,
        })),
      ]
    : milestoneMarkers;

  // 掲載者が書いた質問を先に出す。手数料や決済方法といった共通の説明は
  // 掲載者側で消せると支援者が困るので、その下に必ず残す。
  const faqItems = [
    ...(project.faqs ?? []).map((f) => ({
      q: pick(f.q, f.q_en),
      a: pick(f.a, f.a_en),
    })),
    ...t.detail.faqItems,
  ];

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: project.title,
        text: project.tagline,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("URLをコピーしました！");
    }
  };

  const rewardTypeIcon = (type: string) => {
    switch (type) {
      case "digital": return <Smartphone size={14} />;
      case "physical": return <Package size={14} />;
      case "experience": return <Star size={14} />;
      default: return <Heart size={14} />;
    }
  };

  const rewardTypeLabel = (type: string) => {
    switch (type) {
      case "digital": return "デジタル";
      case "physical": return "物品";
      case "experience": return "体験";
      default: return "リターンなし";
    }
  };

  const theme = themeOverride ?? resolveTheme(project.theme);

  // 支援状況はスマホでは本文より前に、PC ではサイドバーに置きたいので、
  // 同じ中身を置き場所だけ変えて使い回す
  const fundingSummary = (
    <Card>
      {/* ネクストゴール挑戦中の帯。「100% 達成」だけだと終わったように見えて
          離脱されるので、達成したうえでまだ募集中だと最初に伝える */}
      {stretchChallenging && (
        <div
          className="-mx-6 -mt-6 mb-5 px-5 py-3 text-white"
          style={{ background: "var(--pt-gradient)" }}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 whitespace-nowrap">
              {t.detail.stretchRibbonBadge}
            </span>
            <span className="text-[15px] font-bold">
              {t.detail.stretchRibbonTitle}
            </span>
          </div>
          <p className="text-center text-xs text-white/85 mt-1">
            {t.detail.stretchRibbonSub}
          </p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-xs font-bold text-gray-500 mb-1">
          {t.common.raisedSoFar}
        </p>
        <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mb-1">
          <span className="text-3xl font-bold text-gray-800 tabular-nums">
            {formatCurrency(project.current_amount)}
          </span>
          <span className="text-xl font-bold text-caramel-600 tabular-nums">
            {showStretchGauge
              ? uncappedPct
              : hasMilestones
              ? headlinePct
              : stats.progress_percentage}%
          </span>
        </div>
        <p className="text-sm text-gray-500 tabular-nums">
          {hasMilestones ? t.common.finalGoal : t.common.goalAmount}{" "}
          {formatCurrency(finalGoal)}
        </p>
      </div>

      <ProgressBar
        percentage={gaugePct}
        markers={gaugeMarkers}
        extension={gaugeExtension}
        className={showStretchGauge ? "mb-1" : hasMilestones ? "mb-2" : "mb-4"}
      />

      {showStretchGauge && (
        <div className="flex justify-between text-xs text-gray-400 mb-3">
          <span className="text-green-700 font-bold">
            {t.common.finalGoal} {t.common.achieved}
          </span>
          <span>
            {t.detail.stretchTop}{" "}
            <span className="font-bold text-gray-600 tabular-nums">
              {formatCurrency(stretchTop)}
            </span>
          </span>
        </div>
      )}

      {/* ネクストゴールがある場合、全達成の箱は帯（挑戦中）か
          「ネクストゴールもすべて達成」の箱に置き換わる */}
      {hasMilestones && !(allMilestonesAchieved && hasStretch) && (
        nextMilestone ? (
          <div className="mb-4 p-3 rounded-xl text-center bg-caramel-50 border border-line">
            <p className="text-sm font-bold text-gray-800 leading-relaxed">
              あと{" "}
              <span className="text-caramel-600 tabular-nums">
                {formatCurrency(nextMilestone.amount - project.current_amount)}
              </span>{" "}
              で
              <br />
              「{nextMilestone.title}」を達成
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-xl text-center bg-green-50 border border-green-100">
            <p className="text-sm font-bold text-green-700">
              全ての目標を達成しました
            </p>
          </div>
        )
      )}

      {/* ネクストゴール。最終目標を越えたあとだけ出す。達成率には影響しない */}
      {hasStretch && finalGoalReached && (
        nextStretch ? (
          // 「あと〜で達成」の箱と同じテーマ対応クラスを使う。
          // pink-* はテーマ変数に差し替わらず、暗いテーマで白く浮いてしまう
          <div className="mb-4 p-3 rounded-xl text-center bg-caramel-50 border border-candy-pink">
            <p className="text-xs font-bold text-caramel-600 mb-1">
              {t.detail.stretchGoals}
            </p>
            <p className="text-sm font-bold text-gray-800 leading-relaxed">
              {t.detail.stretchNextPrefix}
              {formatCurrency(nextStretch.amount - project.current_amount)}
              {t.detail.stretchNextSuffix}
              <br />
              「{nextStretch.title}」{t.detail.stretchNextAchieve}
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-xl text-center bg-green-50 border border-green-100">
            <p className="text-sm font-bold text-green-700">
              {t.detail.stretchAllAchieved}
            </p>
          </div>
        )
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="text-center p-3 rounded-xl bg-caramel-50">
          <Users size={15} className="mx-auto mb-1 text-gray-400" />
          <p className="text-lg font-bold text-gray-800 tabular-nums">
            {formatNumber(project.backer_count)}
          </p>
          <p className="text-xs text-gray-400">{t.common.backers}</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-caramel-50">
          <Clock size={15} className="mx-auto mb-1 text-gray-400" />
          <p className="text-lg font-bold text-gray-800 tabular-nums">
            {stats.days_left > 0 ? `${stats.days_left}日` : "終了"}
          </p>
          <p className="text-xs text-gray-400">{t.common.daysLeft}</p>
        </div>
      </div>

      {canBack ? (
        <Link href={`/back/${project.slug}`}>
          <Button fullWidth size="lg" className="mb-3">
            {t.common.backThisProject}
          </Button>
        </Link>
      ) : (
        <Button fullWidth size="lg" className="mb-3" disabled>
          {disabledLabel}
        </Button>
      )}

      {!isEnded && (
        <p className="text-xs text-center text-gray-400">
          {t.common.noAccountNeeded}
        </p>
      )}

      <div className="border-t border-line mt-4 pt-4">
        <p className="text-xs text-gray-400 text-center mb-2">{t.detail.feesTitle}</p>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{t.detail.backerFee}</span>
          <span className="font-semibold">{t.detail.backerFeeValue}</span>
        </div>
      </div>
    </Card>
  );

  // 掲載者の紹介は支援判断より優先度が低いので、本文を読み終えた後ろに置く
  const creatorPanel = project.profiles ? (
    <Card variant="outlined">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-caramel-100 flex-shrink-0">
          {project.profiles.avatar_url ? (
            <Image
              src={project.profiles.avatar_url}
              alt={project.profiles.display_name || ""}
              width={44}
              height={44}
              className="w-full h-full object-cover"
              // アイコンURLは掲載者が指定できるため最適化は通さない
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500">
              {project.profiles.display_name?.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-400 font-medium">{t.detail.owner}</p>
          <p className="font-bold text-gray-800">
            {project.profiles.organization_name || project.profiles.display_name}
          </p>
          {project.profiles.organization_name &&
            project.profiles.display_name &&
            project.profiles.display_name !== project.profiles.organization_name && (
              <p className="text-xs text-gray-500">{project.profiles.display_name}</p>
            )}
          {project.profiles.bio && (
            <p className="text-sm text-gray-500 whitespace-pre-line mt-1 leading-relaxed">
              {project.profiles.bio}
            </p>
          )}
          {(project.profiles.website_url || project.profiles.twitter_handle) && (
            <div className="flex items-center gap-3 mt-2">
              {project.profiles.website_url && (
                <a
                  href={project.profiles.website_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-caramel-600 hover:text-caramel-700 transition-colors"
                >
                  <Globe size={12} />
                  Webサイト
                </a>
              )}
              {project.profiles.twitter_handle && (
                <a
                  href={`https://x.com/${project.profiles.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-caramel-600 hover:text-caramel-700 transition-colors"
                >
                  <AtSign size={12} />
                  {project.profiles.twitter_handle}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  ) : null;

  const milestonesPanel = hasMilestones || hasStretch ? (
    <MilestonesProgress
      milestones={milestones}
      currentAmount={project.current_amount}
    />
  ) : null;

  return (
    <ProjectThemeScope theme={theme} className="min-h-screen pt-20" pageLevel>
      {/* パンくず */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-caramel-600 transition-colors font-medium"
        >
          <ChevronLeft size={16} />
          {t.detail.breadcrumb}
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-support-bar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2">
            {/* ヒーロー画像 */}
            <div>
              <div className="relative aspect-square rounded-4xl overflow-hidden bg-caramel-100">
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={project.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                    CaramYell
                  </div>
                )}

                {/* ステータスバッジ */}
                {(hasMilestones ? allMilestonesAchieved : stats.is_funded) && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold text-white bg-green-700">
                      {hasMilestones ? t.detail.allGoalsBadge : t.detail.goalAchievedBadge}
                    </span>
                  </div>
                )}
              </div>

              {gallery.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 mt-3">
                  {gallery.map((url) => (
                    <button
                      key={url}
                      onClick={() => setActiveImage(url)}
                      aria-label="画像を表示"
                      className={cn(
                        "relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden transition-opacity",
                        activeImage === url
                          ? "ring-2 ring-offset-2 ring-caramel-400"
                          : "opacity-60 hover:opacity-100"
                      )}
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              <div className="mb-6" />
            </div>

            {/* タイトル・メタ情報 */}
            <div>
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.categories && (
                    <ThemeTag accent>{project.categories.name_ja}</ThemeTag>
                  )}
                  {project.tags.slice(0, 3).map((tag) => (
                    <ThemeTag key={tag}>#{tag}</ThemeTag>
                  ))}
                </div>

                <h1 className="text-[1.75rem] sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 leading-snug">
                  {pick(project.title, project.title_en)}
                </h1>
                <p className="text-base sm:text-lg text-gray-500 leading-relaxed">{pick(project.tagline, project.tagline_en)}</p>

                {/* 応援・シェアだけをここに残し、掲載者の紹介は本文の後ろに送る */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setLiked(!liked)}
                    aria-pressed={liked}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border bg-white text-sm font-bold transition-colors duration-150",
                      liked
                        ? "border-candy-pink text-caramel-600"
                        : "border-line text-gray-600 hover:bg-caramel-50"
                    )}
                  >
                    <Heart size={15} className={liked ? "fill-current" : ""} />
                    {t.detail.likeAction}
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-line bg-white text-gray-600 text-sm font-bold hover:bg-caramel-50 transition-colors duration-150"
                  >
                    <Share2 size={15} />
                    {t.detail.shareAction}
                  </button>
                </div>
              </div>
            </div>

            {/* 支援状況（スマホのみ。本文を読む前に金額と応援ボタンが見えるようにする） */}
            <div className="lg:hidden space-y-4 mb-6">
              {fundingSummary}
              {milestonesPanel}
            </div>

            {/* リターンは支援導線そのものなので、読み物より先に、
                かつタブ切り替えに関係なく出す */}
            {(project.rewards?.length ?? 0) > 0 && (
              <div>
                <section id="rewards" className="mb-10">
                  <h2 className="text-xl font-bold text-gray-800 mb-1">
                    {t.detail.tabRewards}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {t.detail.rewardsLead}
                  </p>
                  <div className="space-y-4">
                    {(project.rewards || []).map((reward) => (
                      <RewardCard
                        key={reward.id}
                        reward={reward}
                        selected={selectedReward?.id === reward.id}
                        onSelect={() =>
                          setSelectedReward(
                            selectedReward?.id === reward.id ? null : reward
                          )
                        }
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* タブナビ。下線で現在のタブを示す（border-candy-pink はテーマのアクセント色に読み替わる） */}
            <div
              role="tablist"
              className="flex gap-6 border-b border-line mb-6 overflow-x-auto"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "-mb-px py-3 border-b-2 text-sm font-bold transition-colors duration-150 whitespace-nowrap",
                    activeTab === tab.id
                      ? "border-candy-pink text-gray-800"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* タブコンテンツ */}
            <div key={activeTab} className="page-enter">
              {activeTab === "story" && (
                <Card>
                  <Markdown className="text-base">
                    {pick(project.description, project.description_en)}
                  </Markdown>
                  {project.story && (
                    <>
                      <hr className="my-6 border-line" />
                      <Markdown>
                        {pick(project.story, project.story_en)}
                      </Markdown>
                    </>
                  )}
                </Card>
              )}

              {activeTab === "updates" &&
                (updates.length > 0 ? (
                  <div className="space-y-4">
                    {updates.map((update) => (
                      <div key={update.id}>
                        <Card>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-bold text-gray-800">
                              {pick(update.title, update.title_en)}
                            </h3>
                            {update.is_backers_only && (
                              <ThemeTag accent>
                                {t.detail.backersOnlyUpdate}
                              </ThemeTag>
                            )}
                          </div>
                          <Markdown>
                            {pick(update.content, update.content_en)}
                          </Markdown>
                          <p className="text-xs text-gray-400 mt-3">
                            {timeAgo(update.created_at)}
                          </p>
                        </Card>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare size={20} className="mx-auto mb-3 text-gray-400" />
                      <p className="text-sm font-medium">{t.detail.noUpdates}</p>
                    </div>
                  </Card>
                ))}

              {activeTab === "comments" && (
                <Card>
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare size={20} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-sm font-medium">{t.detail.noComments}</p>
                  </div>
                </Card>
              )}
            </div>

            <div>
              <section className="mt-10">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {t.detail.faqTitle}
                </h2>
                <div className="space-y-2">
                  {faqItems.map((item, i) => (
                    <details
                      key={`${i}-${item.q}`}
                      className="group rounded-xl bg-white border border-line"
                    >
                      <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer list-none text-sm font-bold text-gray-800">
                        {item.q}
                        <ChevronDown
                          size={18}
                          className="flex-shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                        />
                      </summary>
                      <p className="px-4 pb-4 text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            </div>

            {creatorPanel && <div className="mt-10">{creatorPanel}</div>}
          </div>

          {/* サイドバー */}
          <div className="lg:col-span-1">
            {/* 中身が画面より高いと下端に手が届かなくなるので、
                サイドバーの上にカーソルがあるときはここだけスクロールさせる */}
            <div className="sticky top-24 space-y-4 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto sidebar-scroll lg:pr-2 lg:-mr-2">
              {/* 支援状況・段階ゴール（スマホでは本文より前に出しているのでここでは隠す） */}
              <div className="hidden lg:block space-y-4">
                {fundingSummary}
                {milestonesPanel}
              </div>

              {/* 選択中のリターン */}
              {selectedReward && (
                <div>
                  <Card className="border-candy-pink">
                    <p className="flex items-center gap-1 text-xs font-bold text-candy-pink mb-2">
                      <Check size={14} />
                      選択中のリターン
                    </p>
                    <p className="font-bold text-gray-800 text-sm mb-1">{selectedReward.title}</p>
                    <p className="text-2xl font-bold text-gray-800 tabular-nums mb-3">
                      {formatCurrency(selectedReward.amount)}
                    </p>
                    <Link href={`/back/${project.slug}?reward=${selectedReward.id}`}>
                      <Button fullWidth size="md">
                        このリターンで応援する
                      </Button>
                    </Link>
                  </Card>
                </div>
              )}

              {/* 決済方法 */}
              <div>
                <Card variant="outlined">
                  <p className="text-xs font-bold text-gray-500 mb-3">{t.detail.paymentMethods}</p>
                  <div className="flex flex-wrap gap-2">
                    {paymentMethodBadges(locale).map((method) => (
                      <span key={method} className="px-2 py-1 rounded-md bg-gray-100 text-xs font-semibold text-gray-600">
                        {method}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
                    <Globe size={12} />
                    <span>{t.detail.intlNote}</span>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 支援バー。md 未満ではグローバルのタブバーを引っ込めてここに差し替えている
          （MobileTabBar 側で詳細ページを除外）。読み進めた先でも支援に入れるように。 */}
      {/* .glass は明るい面のまま読み替わらないので、テーマの面（bg-white）にぼかしを重ねる */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white backdrop-blur-md border-t border-line tabbar-safe">
        <div className="px-4 py-3">
          {canBack ? (
            <Link
              href={
                selectedReward
                  ? `/back/${project.slug}?reward=${selectedReward.id}`
                  : `/back/${project.slug}`
              }
            >
              <Button fullWidth size="lg">
                {t.common.backThisProject}
              </Button>
            </Link>
          ) : (
            <Button fullWidth size="lg" disabled>
              {disabledLabel}
            </Button>
          )}
        </div>
      </div>
    </ProjectThemeScope>
  );
}

function RewardCard({
  reward,
  selected,
  onSelect,
}: {
  reward: Reward;
  selected: boolean;
  onSelect: () => void;
}) {
  const { pick } = useLocale();
  const available = isRewardAvailable(reward);
  const remaining = reward.quantity_total
    ? reward.quantity_total - reward.quantity_claimed
    : null;

  return (
    <div>
      <button
        onClick={onSelect}
        disabled={!available}
        aria-pressed={selected}
        className={cn(
          "w-full text-left p-5 rounded-3xl border transition-colors duration-150",
          selected
            ? "border-candy-pink"
            : available
            ? "border-line hover:border-caramel-300 bg-white"
            : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
        )}
        style={selected ? { background: "var(--pt-surface-soft)" } : {}}
      >
        <div className="flex items-start gap-3">
          {/* チェック */}
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors",
            selected ? "border-candy-pink bg-candy-pink" : "border-gray-300"
          )}>
            {selected && <Check size={12} className="text-white" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xl font-bold text-gray-800 tabular-nums">
                {formatCurrency(reward.amount)}
              </span>
              <ThemeTag>
                {rewardTypeIcon(reward.reward_type)}
                {rewardTypeLabel(reward.reward_type)}
              </ThemeTag>
              {!reward.needs_address && <ThemeTag>住所不要</ThemeTag>}
            </div>

            <h3 className="font-bold text-gray-800 mb-2">
              {pick(reward.title, reward.title_en)}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {pick(reward.description, reward.description_en)}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
              {reward.estimated_delivery_date && (
                <span>
                  配送予定: {new Date(reward.estimated_delivery_date).toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}
                </span>
              )}
              {remaining !== null && (
                <span className={cn("tabular-nums", remaining <= 5 ? "text-red-400 font-bold" : "")}>
                  残り {remaining} 個
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

/**
 * カテゴリ・タグ・リターン種別などの小さなラベル。
 * 共通の Badge は ring-caramel-200 や sky/emerald の地色を使っていて、
 * テーマで読み替わらず暗いテーマの上で浮くので、ここでは読み替え対象の
 * クラス（bg-cream-100 / border-line / text-gray-600 / text-caramel-600）だけで組む。
 */
function ThemeTag({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-line bg-cream-100 text-xs font-semibold",
        accent ? "text-caramel-600" : "text-gray-600"
      )}
    >
      {children}
    </span>
  );
}

function rewardTypeIcon(type: string) {
  switch (type) {
    case "digital": return <Smartphone size={12} />;
    case "physical": return <Package size={12} />;
    case "experience": return <Star size={12} />;
    default: return <Heart size={12} />;
  }
}

function rewardTypeLabel(type: string) {
  switch (type) {
    case "digital": return "デジタル";
    case "physical": return "物品";
    case "experience": return "体験";
    default: return "リターンなし";
  }
}
