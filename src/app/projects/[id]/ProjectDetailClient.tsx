"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
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
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import AnimatedSection from "@/components/animations/AnimatedSection";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocale } from "@/components/i18n/LocaleProvider";
import ProjectThemeScope from "@/components/project/ProjectThemeScope";
import { ProjectTheme, resolveTheme } from "@/lib/theme/project-theme";

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
  const { t, pick } = useLocale();
  const allowComments = project.allow_comments !== false;
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
  const hasMilestones = milestones.length > 0;
  // 段階ゴールがある場合は「最終目標」を基準に進捗を見せる（第1目標達成で満タンに見せない）
  const sortedMilestones = [...milestones].sort((a, b) => a.amount - b.amount);
  const finalGoal = hasMilestones
    ? sortedMilestones[sortedMilestones.length - 1].amount
    : project.goal_amount;
  const nextMilestone = hasMilestones
    ? sortedMilestones.find((m) => project.current_amount < m.amount)
    : undefined;
  const headlinePct = Math.min(
    Math.round((project.current_amount / finalGoal) * 100),
    100
  );
  const allMilestonesAchieved = hasMilestones && !nextMilestone;
  // 進捗バー上の各段階目標マーカー（最終目標＝バー端は除く）
  const milestoneMarkers = hasMilestones
    ? sortedMilestones
        .filter((m) => m.amount < finalGoal)
        .map((m) => ({
          position: (m.amount / finalGoal) * 100,
          label: m.title,
          reached: project.current_amount >= m.amount,
        }))
    : undefined;

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
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 mb-0.5">
          {t.common.raisedSoFar}
        </p>
        <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mb-1">
          <span className="text-3xl font-bold text-caramel-600">
            {formatCurrency(project.current_amount)}
          </span>
          <span className="text-2xl font-bold text-caramel-500">
            {hasMilestones ? headlinePct : stats.progress_percentage}%
          </span>
        </div>
        <p className="text-sm text-gray-400">
          {hasMilestones ? t.common.finalGoal : t.common.goalAmount}{" "}
          {formatCurrency(finalGoal)}
        </p>
      </div>

      <ProgressBar
        percentage={hasMilestones ? headlinePct : stats.progress_percentage}
        markers={milestoneMarkers}
        className={hasMilestones ? "mb-2" : "mb-4"}
      />

      {hasMilestones && (
        nextMilestone ? (
          <div className="mb-4 p-3 rounded-2xl text-center bg-caramel-50 border-2 border-caramel-100">
            <p className="text-sm font-bold text-caramel-700">
              あと {formatCurrency(nextMilestone.amount - project.current_amount)} で
              <br />
              「{nextMilestone.title}」を達成！
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-2xl text-center bg-green-50 border-2 border-green-100">
            <p className="text-sm font-bold text-green-700">
              🎉 全ての目標を達成しました！
            </p>
          </div>
        )
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="text-center p-3 rounded-2xl bg-caramel-50">
          <Users size={16} className="mx-auto mb-1 text-caramel-500" />
          <p className="text-lg font-bold text-gray-800">
            {formatNumber(project.backer_count)}
          </p>
          <p className="text-xs text-gray-400">{t.common.backers}</p>
        </div>
        <div className="text-center p-3 rounded-2xl bg-caramel-50">
          <Clock size={16} className="mx-auto mb-1 text-caramel-500" />
          <p className="text-lg font-bold text-gray-800">
            {stats.days_left > 0 ? `${stats.days_left}日` : "終了"}
          </p>
          <p className="text-xs text-gray-400">{t.common.daysLeft}</p>
        </div>
      </div>

      {isPreview ? (
        <Button fullWidth size="lg" className="mb-3" disabled>
          {t.detail.previewDisabled}
        </Button>
      ) : (
        <Link href={`/back/${project.slug}`}>
          <Button fullWidth size="lg" className="mb-3">
            💝 {t.common.backThisProject}
          </Button>
        </Link>
      )}

      <p className="text-xs text-center text-gray-400">
        {t.common.noAccountNeeded}
      </p>

      <div className="border-t border-caramel-100 mt-4 pt-4">
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
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-caramel-400">
              {project.profiles.display_name?.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-400 font-medium">{t.detail.owner}</p>
          <p className="font-bold text-gray-800">
            {project.profiles.display_name}
          </p>
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

  const milestonesPanel = hasMilestones ? (
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2">
            {/* ヒーロー画像 */}
            <AnimatedSection animation="fade-up">
              <div className="relative aspect-square rounded-4xl overflow-hidden bg-caramel-100 shadow-soft-lg">
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
                  <div className="w-full h-full flex items-center justify-center text-8xl">
                    {project.categories?.icon}
                  </div>
                )}

                {/* ステータスバッジ */}
                {(hasMilestones ? allMilestonesAchieved : stats.is_funded) && (
                  <div className="absolute top-4 right-4">
                    <span className="px-4 py-2 rounded-full text-sm font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #8FD4C4, #A8D8CB)" }}>
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
                        "relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden transition-all",
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
            </AnimatedSection>

            {/* タイトル・メタ情報 */}
            <AnimatedSection animation="fade-up" delay={100}>
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.categories && (
                    <Badge color="pink">
                      {project.categories.icon} {project.categories.name_ja}
                    </Badge>
                  )}
                  {project.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} color="gray">#{tag}</Badge>
                  ))}
                </div>

                <h1 className="text-[1.75rem] sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 leading-snug">
                  {pick(project.title, project.title_en)}
                </h1>
                <p className="text-lg text-gray-500">{pick(project.tagline, project.tagline_en)}</p>

                {/* 応援・シェアだけをここに残し、掲載者の紹介は本文の後ろに送る */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setLiked(!liked)}
                    aria-pressed={liked}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                      liked
                        ? "bg-pink-100 text-pink-500"
                        : "bg-gray-100 text-gray-500 hover:bg-pink-50 hover:text-pink-400"
                    )}
                  >
                    <Heart size={16} className={liked ? "fill-current" : ""} />
                    {t.detail.likeAction}
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gray-100 text-gray-500 text-sm font-semibold hover:bg-caramel-50 hover:text-caramel-500 transition-all duration-200"
                  >
                    <Share2 size={16} />
                    {t.detail.shareAction}
                  </button>
                </div>
              </div>
            </AnimatedSection>

            {/* 支援状況（スマホのみ。本文を読む前に金額と応援ボタンが見えるようにする） */}
            <div className="lg:hidden space-y-4 mb-6">
              <AnimatedSection animation="fade-up" delay={120}>
                {fundingSummary}
              </AnimatedSection>
              {milestonesPanel && (
                <AnimatedSection animation="fade-up" delay={160}>
                  {milestonesPanel}
                </AnimatedSection>
              )}
            </div>

            {/* タブナビ */}
            <AnimatedSection animation="fade-up" delay={150}>
              <div className="flex gap-1 p-1 bg-white rounded-2xl shadow-soft mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                      activeTab === tab.id
                        ? "text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                    style={
                      activeTab === tab.id
                        ? { background: "var(--pt-gradient)" }
                        : {}
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </AnimatedSection>

            {/* タブコンテンツ */}
            <AnimatedSection animation="fade-in" key={activeTab}>
              {activeTab === "story" && (
                <Card>
                  <div className="prose max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                      {pick(project.description, project.description_en)}
                    </div>
                    {project.story && (
                      <>
                        <hr className="my-6 border-caramel-100" />
                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {project.story}
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              )}

              {activeTab === "updates" &&
                (updates.length > 0 ? (
                  <div className="space-y-4">
                    {updates.map((update, i) => (
                      <AnimatedSection
                        key={update.id}
                        animation="fade-up"
                        delay={i * 50}
                      >
                        <Card>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-bold text-gray-800">
                              {pick(update.title, update.title_en)}
                            </h3>
                            {update.is_backers_only && (
                              <Badge color="pink" size="sm">
                                {t.detail.backersOnlyUpdate}
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {pick(update.content, update.content_en)}
                          </p>
                          <p className="text-xs text-gray-400 mt-3">
                            {timeAgo(update.created_at)}
                          </p>
                        </Card>
                      </AnimatedSection>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <div className="text-center py-8 text-gray-400">
                      <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-medium">{t.detail.noUpdates}</p>
                    </div>
                  </Card>
                ))}

              {activeTab === "comments" && (
                <Card>
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{t.detail.noComments}</p>
                    <p className="text-sm mt-1">最初のコメントを書いてみましょう！</p>
                  </div>
                </Card>
              )}
            </AnimatedSection>

            {/* リターンは支援導線そのものなので、タブ切り替えに関係なく本文の下に出す */}
            {(project.rewards?.length ?? 0) > 0 && (
              <AnimatedSection animation="fade-up" delay={80}>
                <section id="rewards" className="mt-10">
                  <h2 className="text-xl font-bold text-gray-800 mb-1">
                    {t.detail.tabRewards}
                  </h2>
                  <p className="text-sm text-gray-400 font-medium mb-4">
                    {t.detail.rewardsLead}
                  </p>
                  <div className="space-y-4">
                    {(project.rewards || []).map((reward, i) => (
                      <RewardCard
                        key={reward.id}
                        reward={reward}
                        selected={selectedReward?.id === reward.id}
                        onSelect={() =>
                          setSelectedReward(
                            selectedReward?.id === reward.id ? null : reward
                          )
                        }
                        index={i}
                      />
                    ))}
                  </div>
                </section>
              </AnimatedSection>
            )}

            <AnimatedSection animation="fade-up" delay={80}>
              <section className="mt-10">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {t.detail.faqTitle}
                </h2>
                <div className="space-y-2">
                  {t.detail.faqItems.map((item) => (
                    <details
                      key={item.q}
                      className="group rounded-2xl bg-white shadow-soft"
                    >
                      <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer list-none text-sm font-semibold text-gray-800">
                        {item.q}
                        <ChevronDown
                          size={18}
                          className="flex-shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                        />
                      </summary>
                      <p className="px-4 pb-4 text-sm text-gray-500 leading-relaxed">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            </AnimatedSection>

            {creatorPanel && (
              <AnimatedSection animation="fade-up" delay={100}>
                <div className="mt-10">{creatorPanel}</div>
              </AnimatedSection>
            )}
          </div>

          {/* サイドバー */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* 支援状況・段階ゴール（スマホでは本文より前に出しているのでここでは隠す） */}
              <div className="hidden lg:block space-y-4">
                <AnimatedSection animation="slide-right">
                  {fundingSummary}
                </AnimatedSection>
                {milestonesPanel && (
                  <AnimatedSection animation="slide-right">
                    {milestonesPanel}
                  </AnimatedSection>
                )}
              </div>

              {/* 選択中のリターン */}
              {selectedReward && (
                <AnimatedSection animation="scale">
                  <Card className="border-2 border-candy-pink">
                    <p className="text-xs font-bold text-candy-pink mb-2">✓ 選択中のリターン</p>
                    <p className="font-bold text-gray-800 text-sm mb-1">{selectedReward.title}</p>
                    <p className="text-2xl font-bold text-caramel-600 mb-3">
                      {formatCurrency(selectedReward.amount)}
                    </p>
                    <Link href={`/back/${project.slug}?reward=${selectedReward.id}`}>
                      <Button fullWidth size="md">
                        このリターンで応援する
                      </Button>
                    </Link>
                  </Card>
                </AnimatedSection>
              )}

              {/* 決済方法 */}
              <AnimatedSection animation="slide-right" delay={100}>
                <Card variant="outlined">
                  <p className="text-xs font-bold text-gray-500 mb-3">{t.detail.paymentMethods}</p>
                  <div className="flex flex-wrap gap-2">
                    {["💳 カード", "🍎 Apple Pay", "🔗 Link"].map((method) => (
                      <span key={method} className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {method}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                    <Globe size={12} />
                    <span>{t.detail.intlNote}</span>
                  </div>
                </Card>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </div>
    </ProjectThemeScope>
  );
}

function RewardCard({
  reward,
  selected,
  onSelect,
  index,
}: {
  reward: Reward;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const available = isRewardAvailable(reward);
  const remaining = reward.quantity_total
    ? reward.quantity_total - reward.quantity_claimed
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <button
        onClick={onSelect}
        disabled={!available}
        className={cn(
          "w-full text-left p-5 rounded-3xl border-2 transition-all duration-200",
          selected
            ? "border-candy-pink shadow-candy"
            : available
            ? "border-caramel-100 hover:border-caramel-300 hover:shadow-soft bg-white"
            : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
        )}
        style={selected ? { background: "var(--pt-surface-soft)" } : {}}
      >
        <div className="flex items-start gap-3">
          {/* チェック */}
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
            selected ? "border-candy-pink bg-candy-pink" : "border-gray-300"
          )}>
            {selected && <Check size={14} className="text-white" />}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xl font-bold text-caramel-600">
                {formatCurrency(reward.amount)}
              </span>
              <Badge
                color={
                  reward.reward_type === "digital"
                    ? "sky"
                    : reward.reward_type === "experience"
                    ? "lavender"
                    : "caramel"
                }
                size="sm"
              >
                {rewardTypeIcon(reward.reward_type)}
                {rewardTypeLabel(reward.reward_type)}
              </Badge>
              {!reward.needs_address && (
                <Badge color="mint" size="sm">
                  住所不要
                </Badge>
              )}
            </div>

            <h3 className="font-bold text-gray-800 mb-2">{reward.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{reward.description}</p>

            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              {reward.estimated_delivery_date && (
                <span>
                  📅 配送予定: {new Date(reward.estimated_delivery_date).toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}
                </span>
              )}
              {remaining !== null && (
                <span className={cn(remaining <= 5 ? "text-red-400 font-semibold" : "")}>
                  残り {remaining} 個
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </motion.div>
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
