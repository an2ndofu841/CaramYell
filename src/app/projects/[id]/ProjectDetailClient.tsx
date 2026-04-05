"use client";

import { useState } from "react";
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
  MapPin,
  Package,
  Smartphone,
  Star,
  MessageSquare,
  Globe,
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
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import AnimatedSection from "@/components/animations/AnimatedSection";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProjectDetailClientProps {
  project: Project;
}

const tabs = [
  { id: "story", label: "プロジェクト詳細" },
  { id: "rewards", label: "リターン" },
  { id: "updates", label: "活動報告" },
  { id: "comments", label: "コメント" },
];

export default function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  const [activeTab, setActiveTab] = useState("story");
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [liked, setLiked] = useState(false);
  const stats = calcProjectStats(project);

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

  return (
    <div className="min-h-screen pt-20" style={{ background: "#FFFBF5" }}>
      {/* パンくず */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-caramel-600 transition-colors font-medium"
        >
          <ChevronLeft size={16} />
          プロジェクト一覧
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2">
            {/* ヒーロー画像 */}
            <AnimatedSection animation="fade-up">
              <div className="relative aspect-video rounded-4xl overflow-hidden bg-caramel-100 mb-6 shadow-soft-lg">
                {project.main_image_url ? (
                  <Image
                    src={project.main_image_url}
                    alt={project.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl">
                    {project.categories?.icon}
                  </div>
                )}

                {/* ステータスバッジ */}
                {stats.is_funded && (
                  <div className="absolute top-4 right-4">
                    <span className="px-4 py-2 rounded-full text-sm font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #4ECDC4, #74C0FC)" }}>
                      🎉 目標達成！
                    </span>
                  </div>
                )}
              </div>
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

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 leading-tight">
                  {project.title}
                </h1>
                <p className="text-lg text-gray-500">{project.tagline}</p>

                {/* クリエイター情報 */}
                {project.profiles && (
                  <div className="flex items-center gap-3 mt-4 p-4 rounded-2xl bg-white shadow-soft">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-caramel-100 flex-shrink-0">
                      {project.profiles.avatar_url ? (
                        <Image
                          src={project.profiles.avatar_url}
                          alt={project.profiles.display_name || ""}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-caramel-400">
                          {project.profiles.display_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">プロジェクトオーナー</p>
                      <p className="font-bold text-gray-800">{project.profiles.display_name}</p>
                      {project.profiles.bio && (
                        <p className="text-xs text-gray-500">{project.profiles.bio}</p>
                      )}
                    </div>
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => setLiked(!liked)}
                        className={cn(
                          "p-2 rounded-full transition-all duration-200",
                          liked ? "bg-pink-100 text-pink-500" : "bg-gray-100 text-gray-400 hover:bg-pink-50 hover:text-pink-400"
                        )}
                      >
                        <Heart size={18} className={liked ? "fill-current" : ""} />
                      </button>
                      <button
                        onClick={handleShare}
                        className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-caramel-50 hover:text-caramel-500 transition-all duration-200"
                      >
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </AnimatedSection>

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
                        ? { background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }
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
                      {project.description}
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

              {activeTab === "rewards" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400 font-medium">
                    💡 リターンを選んで応援しましょう
                  </p>
                  {(project.rewards || []).map((reward, i) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      selected={selectedReward?.id === reward.id}
                      onSelect={() => setSelectedReward(
                        selectedReward?.id === reward.id ? null : reward
                      )}
                      index={i}
                    />
                  ))}
                </div>
              )}

              {activeTab === "updates" && (
                <Card>
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">まだ活動報告はありません</p>
                  </div>
                </Card>
              )}

              {activeTab === "comments" && (
                <Card>
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">コメントはまだありません</p>
                    <p className="text-sm mt-1">最初のコメントを書いてみましょう！</p>
                  </div>
                </Card>
              )}
            </AnimatedSection>
          </div>

          {/* サイドバー */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* 支援状況カード */}
              <AnimatedSection animation="slide-right">
                <Card>
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-bold text-caramel-600">
                        {formatCurrency(project.current_amount)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      目標金額 {formatCurrency(project.goal_amount)} の
                      <span className="font-bold text-caramel-500"> {stats.progress_percentage}%</span>
                    </p>
                  </div>

                  <ProgressBar percentage={stats.progress_percentage} className="mb-4" />

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="text-center p-3 rounded-2xl bg-caramel-50">
                      <Users size={16} className="mx-auto mb-1 text-caramel-500" />
                      <p className="text-lg font-bold text-gray-800">
                        {formatNumber(project.backer_count)}
                      </p>
                      <p className="text-xs text-gray-400">人が応援</p>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-caramel-50">
                      <Clock size={16} className="mx-auto mb-1 text-caramel-500" />
                      <p className="text-lg font-bold text-gray-800">
                        {stats.days_left > 0 ? `${stats.days_left}日` : "終了"}
                      </p>
                      <p className="text-xs text-gray-400">残り</p>
                    </div>
                  </div>

                  <Link href={`/back/${project.slug}`}>
                    <Button fullWidth size="lg" className="mb-3">
                      💝 このプロジェクトを応援する
                    </Button>
                  </Link>

                  <p className="text-xs text-center text-gray-400">
                    アカウント登録なしで応援できます ✨
                  </p>

                  <div className="border-t border-caramel-100 mt-4 pt-4">
                    <p className="text-xs text-gray-400 text-center mb-2">手数料について</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>掲載者への手数料</span>
                      <span className="font-bold text-green-600">0円</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>出資者の手数料</span>
                      <span className="font-semibold">+10%（決済時）</span>
                    </div>
                  </div>
                </Card>
              </AnimatedSection>

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
                  <p className="text-xs font-bold text-gray-500 mb-3">対応決済方法</p>
                  <div className="flex flex-wrap gap-2">
                    {[" Apple Pay", " Google Pay", " カード", " PayPal"].map((method) => (
                      <span key={method} className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {method}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                    <Globe size={12} />
                    <span>海外からの支援にも対応</span>
                  </div>
                </Card>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </div>
    </div>
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
        style={selected ? { background: "rgba(255, 107, 157, 0.03)" } : {}}
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
