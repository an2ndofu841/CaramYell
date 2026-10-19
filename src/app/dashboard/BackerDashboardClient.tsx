"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ImageIcon,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
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
  const { user, profile, isCreator, loading: authLoading } = useAuth();
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
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <Loader2 size={24} className="animate-spin text-ink-muted mx-auto mb-3" />
          <p className="text-sm text-ink-muted">読み込み中...</p>
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
    { label: "応援した金額", value: formatCurrency(totalBacked) },
    { label: "応援したプロジェクト", value: `${formatNumber(projectCount)}件` },
    { label: "お届け待ち", value: `${formatNumber(awaitingDelivery)}件` },
  ];

  return (
    <DashboardShell
      title="マイページ"
      description="応援したプロジェクトとリターンのお届け状況"
    >
      <dl className="grid grid-cols-3 rounded-xl border border-line bg-white divide-x divide-line mb-8">
        {summary.map((item) => (
          <div key={item.label} className="px-3 sm:px-6 py-4 sm:py-5 min-w-0">
            <dt className="text-[11px] sm:text-xs font-bold text-ink-muted mb-1 truncate">
              {item.label}
            </dt>
            <dd className="text-lg sm:text-2xl font-bold text-ink tabular-nums truncate">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {backings.length === 0 ? (
        <div className="rounded-xl border border-line bg-white px-6 py-14 text-center">
          <h2
            className="text-lg font-bold text-ink mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            まだ応援したプロジェクトはありません
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            応援するとここに履歴が並び、リターンのお届け状況も確認できます。
          </p>
          <Link href="/projects">
            <Button variant="outline">プロジェクトを見る</Button>
          </Link>
        </div>
      ) : (
        <section>
          <h2 className="text-xs font-bold text-ink-muted mb-3">応援した履歴</h2>
          <div className="space-y-3">
            {backings.map((backing) => (
              <BackingCard key={backing.id} backing={backing} />
            ))}
          </div>
        </section>
      )}

      {/* 掲載権限のない人にだけ、事務所・レーベル向けの掲載申し込みを案内する */}
      {profile && !isCreator && (
        <aside className="mt-10 rounded-xl border border-line bg-white px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">事務所・レーベルの方へ</p>
            <p className="text-sm text-ink-muted mt-0.5">
              所属アーティストの企画を掲載できます。
            </p>
          </div>
          <Link
            href="/apply"
            className="inline-flex items-center gap-1 text-sm font-bold text-ink underline underline-offset-4 decoration-line-strong hover:decoration-ink flex-shrink-0"
          >
            掲載を申し込む
            <ChevronRight size={14} />
          </Link>
        </aside>
      )}
    </DashboardShell>
  );
}

function BackingCard({ backing }: { backing: Backing }) {
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
    <article className="rounded-xl border border-line bg-white">
      <div className="p-4 sm:p-5">
        <div className="flex gap-4">
          <div className="w-20 h-16 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0 flex items-center justify-center text-ink-faint">
            {project?.main_image_url ? (
              <img
                src={project.main_image_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon size={18} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-ink text-sm line-clamp-2 leading-snug">
                {project?.title || "（削除されたプロジェクト）"}
              </h3>
              {needsShipping && (
                <Badge color={shipping.color} size="sm" className="flex-shrink-0">
                  {shipping.icon}
                  {shipping.label}
                </Badge>
              )}
            </div>

            <p className="text-xs text-ink-muted mb-2">
              {timeAgo(backing.created_at)}に応援 ·{" "}
              <strong className="font-bold text-ink tabular-nums">
                {formatCurrency(backing.total_amount)}
              </strong>
            </p>

            {project && (
              <>
                <ProgressBar percentage={progress} className="mb-1.5" />
                <p className="text-xs text-ink-muted tabular-nums">
                  {formatCurrency(amount)} / {formatCurrency(project.goal_amount)}（
                  {progress}%）
                </p>
              </>
            )}
          </div>
        </div>

        {items.length > 0 && (
          <ul className="mt-3 pt-3 border-t border-line space-y-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-xs">
                <span className="text-ink-soft">{item.reward_title}</span>
                <span className="text-ink-muted tabular-nums">×{item.quantity}</span>
              </li>
            ))}
          </ul>
        )}

        {backing.tracking_number && (
          <p className="mt-3 text-xs text-ink-muted">
            追跡番号:{" "}
            <span className="font-bold text-ink tabular-nums">{backing.tracking_number}</span>
            {backing.shipping_carrier && `（${backing.shipping_carrier}）`}
          </p>
        )}

        {showDetail && (
          <div className="mt-3 pt-3 border-t border-line text-xs text-ink-muted space-y-1.5">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0">
                  {item.reward_title}
                  <span className="text-ink-faint tabular-nums">
                    {" "}
                    {formatCurrency(item.unit_amount)} × {item.quantity}
                  </span>
                </span>
                <span className="font-semibold text-ink whitespace-nowrap tabular-nums">
                  {formatCurrency(item.unit_amount * item.quantity)}
                </span>
              </div>
            ))}
            {/* リターンなしの応援や、リターンに上乗せした自由応援額 */}
            {backing.amount > itemsTotal && (
              <div className="flex justify-between">
                <span>{items.length > 0 ? "追加の応援金額" : "応援金額"}</span>
                <span className="font-semibold text-ink tabular-nums">
                  {formatCurrency(backing.amount - itemsTotal)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>手数料</span>
              <span className="font-semibold text-ink tabular-nums">
                {formatCurrency(backing.fee_amount)}
              </span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-line">
              <span className="font-bold text-ink">お支払い合計</span>
              <span className="font-bold text-ink tabular-nums">
                {formatCurrency(backing.total_amount)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex border-t border-line divide-x divide-line text-xs font-semibold">
        <button
          onClick={() => setShowDetail((v) => !v)}
          className="flex-1 py-2.5 text-ink-muted hover:bg-cream-50 hover:text-ink transition-colors rounded-bl-xl"
        >
          {showDetail ? "内訳を閉じる" : "内訳を見る"}
        </button>
        {project && (
          <Link
            href={`/projects/${project.slug || project.id}`}
            className="flex-1 flex items-center justify-center gap-1 py-2.5 text-ink hover:bg-cream-50 transition-colors rounded-br-xl"
          >
            活動報告を見る
            <ChevronRight size={14} />
          </Link>
        )}
      </div>
    </article>
  );
}
