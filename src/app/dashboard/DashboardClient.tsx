"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Plus,
  BarChart3,
  Settings,
  Bell,
  Eye,
  Edit,
  Share2,
  ChevronRight,
  Sparkles,
  Heart,
  MessageSquare,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import AnimatedSection from "@/components/animations/AnimatedSection";
import { formatCurrency, formatNumber, calcProjectStats } from "@/lib/utils";

// ダミーデータ
const myProjects = [
  {
    id: "1",
    title: "世界で初めての「香りで楽しむ音楽アルバム」を作りたい！",
    slug: "scent-music-album",
    status: "funded",
    goal_amount: 1500000,
    current_amount: 1823000,
    backer_count: 342,
    end_date: "2025-08-31",
    main_image_url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80",
    categories: { icon: "🎵", name_ja: "音楽" },
  },
  {
    id: "2",
    title: "新作インディーゲーム「星の子どもたち」",
    slug: "star-children-game",
    status: "active",
    goal_amount: 800000,
    current_amount: 234000,
    backer_count: 78,
    end_date: "2025-09-15",
    main_image_url: null,
    categories: { icon: "🎮", name_ja: "ゲーム" },
  },
];

const recentBackers = [
  { nickname: "みかん🍊", amount: 3000, message: "応援してます！頑張ってください！", time: "2時間前" },
  { nickname: "匿名", amount: 15000, message: "", time: "5時間前" },
  { nickname: "Hana", amount: 1000, message: "楽しみにしています", time: "1日前" },
  { nickname: "ゆみこ", amount: 50000, message: "VIPで楽しみたいです！", time: "2日前" },
];

const stats = {
  totalRaised: 2057000,
  totalBackers: 420,
  activeProjects: 1,
  avgDailyBackers: 8.4,
};

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "backers">("overview");

  return (
    <div className="min-h-screen pt-20" style={{ background: "#FFFBF5" }}>
      {/* ヘッダー */}
      <div className="py-8" style={{ background: "linear-gradient(135deg, #2D1B4E 0%, #1a0f2e 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">ダッシュボード</h1>
              <p className="text-white/50 text-sm">プロジェクトの状況を管理しましょう</p>
            </div>
            <Link href="/projects/create">
              <Button icon={<Plus size={18} />} size="md">
                新しいプロジェクト
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* サマリーカード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "累計支援金額", value: formatCurrency(stats.totalRaised), icon: <DollarSign size={20} />, color: "#FF6B9D" },
            { label: "合計支援者数", value: `${formatNumber(stats.totalBackers)}人`, icon: <Users size={20} />, color: "#FFB347" },
            { label: "掲載中プロジェクト", value: `${stats.activeProjects}件`, icon: <TrendingUp size={20} />, color: "#4ECDC4" },
            { label: "1日平均支援者", value: `${stats.avgDailyBackers}人`, icon: <BarChart3 size={20} />, color: "#C3B1E1" },
          ].map((item, i) => (
            <AnimatedSection key={i} animation="scale" delay={i * 80}>
              <Card>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                    style={{ background: item.color }}
                  >
                    {item.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-800">{item.value}</p>
                <p className="text-xs text-gray-400 font-medium mt-1">{item.label}</p>
              </Card>
            </AnimatedSection>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* プロジェクト一覧 */}
          <div className="lg:col-span-2">
            <AnimatedSection animation="fade-up">
              <h2 className="text-lg font-bold text-gray-800 mb-4">マイプロジェクト</h2>
              <div className="space-y-4">
                {myProjects.map((project, i) => {
                  const pStats = {
                    progress_percentage: Math.min(Math.round((project.current_amount / project.goal_amount) * 100), 100),
                    days_left: Math.max(0, Math.ceil((new Date(project.end_date).getTime() - Date.now()) / 86400000)),
                    is_funded: project.current_amount >= project.goal_amount,
                    average_backing: Math.round(project.current_amount / project.backer_count),
                  };

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card hover>
                        <div className="flex gap-4">
                          <div className="w-20 h-16 rounded-2xl overflow-hidden bg-caramel-100 flex-shrink-0 flex items-center justify-center text-3xl">
                            {project.main_image_url ? (
                              <img
                                src={project.main_image_url}
                                alt={project.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              project.categories?.icon
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-snug">
                                {project.title}
                              </h3>
                              <Badge
                                color={project.status === "funded" ? "mint" : project.status === "active" ? "sky" : "gray"}
                                size="sm"
                              >
                                {project.status === "funded" ? "🎉 達成" : project.status === "active" ? "掲載中" : project.status}
                              </Badge>
                            </div>

                            <ProgressBar percentage={pStats.progress_percentage} className="mb-2" />

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>
                                <strong className="text-caramel-600">{formatCurrency(project.current_amount)}</strong>
                                {" "}/ {formatCurrency(project.goal_amount)}
                              </span>
                              <span>{project.backer_count}人が応援 · 残り{pStats.days_left}日</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-3 border-t border-caramel-100">
                          <Link href={`/projects/${project.slug}`} className="flex-1">
                            <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-caramel-50 hover:text-caramel-600 transition-colors">
                              <Eye size={14} />
                              プレビュー
                            </button>
                          </Link>
                          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-caramel-50 hover:text-caramel-600 transition-colors">
                            <Edit size={14} />
                            編集
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-caramel-50 hover:text-caramel-600 transition-colors">
                            <Share2 size={14} />
                            シェア
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatedSection>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 最新の支援者 */}
            <AnimatedSection animation="slide-right">
              <Card>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart size={16} className="text-candy-pink" />
                  最新の応援
                </h3>
                <div className="space-y-3">
                  {recentBackers.map((backer, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-caramel-100 flex items-center justify-center text-sm flex-shrink-0">
                        {backer.nickname === "匿名" ? "🎭" : backer.nickname.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">{backer.nickname}</span>
                          <span className="text-sm font-bold text-caramel-600">{formatCurrency(backer.amount)}</span>
                        </div>
                        {backer.message && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            💬 {backer.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-300 mt-0.5">{backer.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 text-xs font-semibold text-caramel-500 hover:text-caramel-600 transition-colors">
                  すべて見る →
                </button>
              </Card>
            </AnimatedSection>

            {/* クイックアクション */}
            <AnimatedSection animation="slide-right" delay={100}>
              <Card variant="outlined">
                <h3 className="font-bold text-gray-800 mb-3">クイックアクション</h3>
                <div className="space-y-2">
                  {[
                    { icon: <Bell size={16} />, label: "活動報告を書く", desc: "支援者に近況を伝える" },
                    { icon: <Sparkles size={16} />, label: "AIで英語版を作成", desc: "海外支援者を呼び込む" },
                    { icon: <BarChart3 size={16} />, label: "詳細な統計を見る", desc: "アクセス・支援分析" },
                    { icon: <Settings size={16} />, label: "プロジェクト設定", desc: "内容の編集・変更" },
                  ].map((action, i) => (
                    <button
                      key={i}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-caramel-50 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-caramel-100 flex items-center justify-center text-caramel-500 group-hover:bg-caramel-200 transition-colors">
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700">{action.label}</p>
                        <p className="text-xs text-gray-400">{action.desc}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-caramel-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}
