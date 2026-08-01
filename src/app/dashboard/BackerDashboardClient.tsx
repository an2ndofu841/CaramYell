"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  DollarSign,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import AnimatedSection from "@/components/animations/AnimatedSection";
import DashboardShell from "./DashboardShell";
import { formatCurrency, formatNumber, timeAgo } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Backer, Project, Category, ShippingStatus } from "@/types";

interface BackedProject extends Project {
  categories?: Category;
}

interface Backing extends Backer {
  projects?: BackedProject;
}

const SHIPPING_META: Record<
  ShippingStatus,
  { label: string; color: "gray" | "lemon" | "sky" | "mint"; icon: React.ReactNode }
> = {
  pending: { label: "発送準備前", color: "gray", icon: <Clock size={13} /> },
  preparing: { label: "発送準備中", color: "lemon", icon: <Package size={13} /> },
  shipped: { label: "発送済み", color: "sky", icon: <Truck size={13} /> },
  delivered: { label: "お届け済み", color: "mint", icon: <CheckCircle2 size={13} /> },
};

export default function BackerDashboardClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [backings, setBackings] = useState<Backing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBackings = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/backings");
      if (res.status === 401) {
        router.push("/auth/login?redirect=/dashboard");
        return;
      }
      const data = await res.json();
      setBackings(data.backings || []);
    } catch {
      // 取得できなくても画面は開けるようにしておく
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/dashboard");
      return;
    }
    if (user) fetchBackings();
  }, [user, authLoading, router, fetchBackings]);

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

  const totalBacked = backings.reduce((s, b) => s + (b.total_amount || 0), 0);
  const projectCount = new Set(backings.map((b) => b.project_id)).size;
  // 発送を待っている品目があるかは支援者が一番気にするところ
  const awaitingDelivery = backings.filter(
    (b) => b.guest_address && b.shipping_status !== "delivered"
  ).length;

  const summary = [
    {
      label: "応援した金額",
      value: formatCurrency(totalBacked),
      icon: <DollarSign size={20} />,
      color: "#F2807B",
    },
    {
      label: "応援したプロジェクト",
      value: `${formatNumber(projectCount)}件`,
      icon: <Heart size={20} />,
      color: "#F5A34B",
    },
    {
      label: "お届け待ち",
      value: `${formatNumber(awaitingDelivery)}件`,
      icon: <Package size={20} />,
      color: "#8FD4C4",
    },
  ];

  return (
    <DashboardShell
      title="マイページ"
      description="応援したプロジェクトとリターンのお届け状況"
    >
      <div className="grid grid-cols-3 gap-4 mb-8">
        {summary.map((item, i) => (
          <AnimatedSection key={item.label} animation="scale" delay={i * 80}>
            <Card>
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white mb-3"
                style={{ background: item.color }}
              >
                {item.icon}
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">
                {item.value}
              </p>
              <p className="text-xs text-gray-400 font-medium mt-1">{item.label}</p>
            </Card>
          </AnimatedSection>
        ))}
      </div>

      {backings.length === 0 ? (
        <AnimatedSection animation="fade-up">
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🍬</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                気になるプロジェクトを応援しよう
              </h2>
              <p className="text-gray-500 mb-6">
                応援するとここに履歴が並び、リターンのお届け状況も確認できます。
              </p>
              <Link href="/projects">
                <Button size="lg">プロジェクトを見る</Button>
              </Link>
            </div>
          </Card>
        </AnimatedSection>
      ) : (
        <AnimatedSection animation="fade-up">
          <h2 className="text-lg font-bold text-gray-800 mb-4">応援した履歴</h2>
          <div className="space-y-4">
            {backings.map((backing, i) => (
              <BackingCard key={backing.id} backing={backing} index={i} />
            ))}
          </div>
        </AnimatedSection>
      )}
    </DashboardShell>
  );
}

function BackingCard({ backing, index }: { backing: Backing; index: number }) {
  const [showDetail, setShowDetail] = useState(false);
  const project = backing.projects;
  const items = backing.backer_items || [];
  const itemsTotal = items.reduce(
    (sum, item) => sum + item.unit_amount * item.quantity,
    0
  );
  const needsShipping = !!backing.guest_address;
  const shipping = SHIPPING_META[backing.shipping_status || "pending"];

  const amount = project?.current_amount || 0;
  const progress = project
    ? Math.min(Math.round((amount / (project.goal_amount || 1)) * 100), 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.08, 0.4) }}
    >
      <Card>
        <div className="flex gap-4">
          <div className="w-20 h-16 rounded-2xl overflow-hidden bg-caramel-100 flex-shrink-0 flex items-center justify-center text-3xl">
            {project?.main_image_url ? (
              <img
                src={project.main_image_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              project?.categories?.icon || "📋"
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-snug">
                {project?.title || "（削除されたプロジェクト）"}
              </h3>
              {needsShipping && (
                <Badge color={shipping.color} size="sm">
                  <span className="flex items-center gap-1">
                    {shipping.icon}
                    {shipping.label}
                  </span>
                </Badge>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-2">
              {timeAgo(backing.created_at)}に応援 ·{" "}
              <strong className="text-caramel-600">
                {formatCurrency(backing.total_amount)}
              </strong>
            </p>

            {project && (
              <>
                <ProgressBar percentage={progress} className="mb-1.5" />
                <p className="text-xs text-gray-500">
                  {formatCurrency(amount)} / {formatCurrency(project.goal_amount)}（
                  {progress}%）
                </p>
              </>
            )}
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-3 pt-3 border-t border-caramel-100 space-y-1.5">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-xs">
                <span className="text-gray-600 font-medium">{item.reward_title}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-caramel-50 text-caramel-600 font-bold">
                  ×{item.quantity}
                </span>
              </div>
            ))}
          </div>
        )}

        {backing.tracking_number && (
          <p className="mt-3 text-xs text-gray-500">
            追跡番号:{" "}
            <span className="font-bold text-gray-700">{backing.tracking_number}</span>
            {backing.shipping_carrier && `（${backing.shipping_carrier}）`}
          </p>
        )}

        <div className="flex gap-2 mt-4 pt-3 border-t border-caramel-100">
          <button
            onClick={() => setShowDetail((v) => !v)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-caramel-50 hover:text-caramel-600 transition-colors"
          >
            {showDetail ? "内訳を閉じる" : "内訳を見る"}
          </button>
          {project && (
            <Link
              href={`/projects/${project.slug || project.id}`}
              className="flex-1"
            >
              <button
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-colors"
                style={{ background: "linear-gradient(135deg, #F2807B, #F5A34B)" }}
              >
                活動報告を見る
                <ChevronRight size={14} />
              </button>
            </Link>
          )}
        </div>

        {showDetail && (
          <div className="mt-3 pt-3 border-t border-caramel-100 text-xs text-gray-500 space-y-1.5">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0">
                  {item.reward_title}
                  <span className="text-gray-400">
                    {" "}
                    {formatCurrency(item.unit_amount)} × {item.quantity}
                  </span>
                </span>
                <span className="font-semibold text-gray-700 whitespace-nowrap">
                  {formatCurrency(item.unit_amount * item.quantity)}
                </span>
              </div>
            ))}
            {/* リターンなしの応援や、リターンに上乗せした自由応援額 */}
            {backing.amount > itemsTotal && (
              <div className="flex justify-between">
                <span>{items.length > 0 ? "追加の応援金額" : "応援金額"}</span>
                <span className="font-semibold text-gray-700">
                  {formatCurrency(backing.amount - itemsTotal)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>手数料</span>
              <span className="font-semibold text-gray-700">
                {formatCurrency(backing.fee_amount)}
              </span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-caramel-50">
              <span className="font-bold text-gray-700">お支払い合計</span>
              <span className="font-bold text-caramel-600">
                {formatCurrency(backing.total_amount)}
              </span>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
