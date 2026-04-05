"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Plus,
  BarChart3,
  Eye,
  Share2,
  ChevronRight,
  Heart,
  Loader2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import AnimatedSection from "@/components/animations/AnimatedSection";
import { formatCurrency, formatNumber, getStatusLabel } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Project, Category, Reward } from "@/types";

interface DashboardProject extends Project {
  categories: Category | null;
  rewards: Reward[];
  live_backer_count: number;
  live_current_amount: number;
}

export default function DashboardClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/projects");
      if (res.status === 401) {
        router.push("/auth/login?redirect=/dashboard");
        return;
      }
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/dashboard");
      return;
    }
    if (user) fetchProjects();
  }, [user, authLoading, router, fetchProjects]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-candy-pink mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeProjects = projects.filter((p) =>
    ["active", "funded"].includes(p.status)
  );
  const totalRaised = projects.reduce(
    (s, p) => s + (p.live_current_amount || p.current_amount || 0),
    0
  );
  const totalBackers = projects.reduce(
    (s, p) => s + (p.live_backer_count || p.backer_count || 0),
    0
  );

  const statusBadge = (status: string) => {
    const { label, color } = getStatusLabel(status);
    const colorMap: Record<string, "pink" | "caramel" | "mint" | "lavender" | "lemon" | "sky" | "gray"> = {
      pink: "pink",
      green: "mint",
      yellow: "lemon",
      blue: "sky",
      red: "pink",
      gray: "gray",
    };
    return (
      <Badge color={colorMap[color] || "gray"} size="sm">
        {label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen pt-20" style={{ background: "#FFFBF5" }}>
      <div
        className="py-8"
        style={{ background: "linear-gradient(135deg, #2D1B4E 0%, #1a0f2e 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">ダッシュボード</h1>
              <p className="text-white/50 text-sm">
                プロジェクトの状況を管理しましょう
              </p>
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
            {
              label: "累計支援金額",
              value: formatCurrency(totalRaised),
              icon: <DollarSign size={20} />,
              color: "#FF6B9D",
            },
            {
              label: "合計支援者数",
              value: `${formatNumber(totalBackers)}人`,
              icon: <Users size={20} />,
              color: "#FFB347",
            },
            {
              label: "掲載中プロジェクト",
              value: `${activeProjects.length}件`,
              icon: <TrendingUp size={20} />,
              color: "#4ECDC4",
            },
            {
              label: "全プロジェクト",
              value: `${projects.length}件`,
              icon: <BarChart3 size={20} />,
              color: "#C3B1E1",
            },
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
                <p className="text-xs text-gray-400 font-medium mt-1">
                  {item.label}
                </p>
              </Card>
            </AnimatedSection>
          ))}
        </div>

        {/* プロジェクト一覧 */}
        {projects.length === 0 ? (
          <AnimatedSection animation="fade-up">
            <Card>
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🚀</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  最初のプロジェクトを作りましょう
                </h2>
                <p className="text-gray-500 mb-6">
                  AIのサポートで、最短10分でページが完成します
                </p>
                <Link href="/projects/create">
                  <Button icon={<Plus size={18} />} size="lg">
                    プロジェクトを作る
                  </Button>
                </Link>
              </div>
            </Card>
          </AnimatedSection>
        ) : (
          <AnimatedSection animation="fade-up">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              マイプロジェクト
            </h2>
            <div className="space-y-4">
              {projects.map((project, i) => {
                const amount =
                  project.live_current_amount || project.current_amount || 0;
                const backers =
                  project.live_backer_count || project.backer_count || 0;
                const progress = Math.min(
                  Math.round((amount / (project.goal_amount || 1)) * 100),
                  100
                );
                const daysLeft = project.end_date
                  ? Math.max(
                      0,
                      Math.ceil(
                        (new Date(project.end_date).getTime() - Date.now()) /
                          86400000
                      )
                    )
                  : 0;

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
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
                            project.categories?.icon || "📋"
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-snug">
                              {project.title}
                            </h3>
                            {statusBadge(project.status)}
                          </div>

                          <ProgressBar percentage={progress} className="mb-2" />

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              <strong className="text-caramel-600">
                                {formatCurrency(amount)}
                              </strong>{" "}
                              / {formatCurrency(project.goal_amount)}
                            </span>
                            <span>
                              {backers}人が応援 · 残り{daysLeft}日
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-3 border-t border-caramel-100">
                        <Link
                          href={`/projects/${project.slug || project.id}`}
                          className="flex-1"
                        >
                          <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-caramel-50 hover:text-caramel-600 transition-colors">
                            <Eye size={14} />
                            プレビュー
                          </button>
                        </Link>
                        <Link
                          href={`/dashboard/projects/${project.id}`}
                          className="flex-1"
                        >
                          <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-colors"
                            style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }}>
                            管理する
                            <ChevronRight size={14} />
                          </button>
                        </Link>
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
        )}
      </div>
    </div>
  );
}
