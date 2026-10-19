"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ChevronRight } from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

interface Stats {
  reviewing: number;
  active: number;
  funded: number;
  completed: number;
  draft: number;
  users: number;
  /** 確認待ちの掲載申請の数 */
  pendingApplications: number;
  gmv: number;
  totalBackers: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (res.ok) setStats(data.stats);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 size={24} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  // 運営が手を動かす必要があるもの。0件のときは目立たせない
  const todos = [
    {
      label: "確認待ちの掲載申請",
      count: stats?.pendingApplications ?? 0,
      href: "/admin/applications",
    },
    {
      label: "審査待ちのプロジェクト",
      count: stats?.reviewing ?? 0,
      href: "/admin/review",
    },
  ];

  const metrics: { label: string; value: string; href?: string }[] = [
    { label: "掲載中", value: `${formatNumber(stats?.active ?? 0)}件`, href: "/admin/projects" },
    { label: "登録ユーザー", value: `${formatNumber(stats?.users ?? 0)}人`, href: "/admin/users" },
    { label: "流通総額", value: formatCurrency(stats?.gmv ?? 0) },
    { label: "累計支援者", value: `${formatNumber(stats?.totalBackers ?? 0)}人` },
  ];

  const statusCounts = [
    { label: "達成", value: stats?.funded ?? 0 },
    { label: "完了", value: stats?.completed ?? 0 },
    { label: "下書き", value: stats?.draft ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">概要</h1>
      <p className="text-sm text-ink-muted mb-6">サービス全体の状況</p>

      <h2 className="text-xs font-bold text-ink-muted mb-2">対応が必要なもの</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line rounded-xl overflow-hidden mb-8">
        {todos.map((t) => {
          const pending = t.count > 0;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group flex items-center justify-between gap-4 bg-white px-5 py-4 hover:bg-cream-50 transition-colors"
            >
              <div className="min-w-0">
                <p className={cn("text-sm", pending ? "font-bold text-ink" : "text-ink-muted")}>
                  {t.label}
                </p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-bold tabular-nums",
                    pending ? "text-ink" : "text-ink-faint"
                  )}
                >
                  {t.count}
                  <span className="ml-0.5 text-sm font-semibold">件</span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {pending && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800">
                    要対応
                  </span>
                )}
                <ChevronRight
                  size={16}
                  className="text-ink-faint group-hover:text-ink transition-colors"
                />
              </div>
            </Link>
          );
        })}
      </div>

      <h2 className="text-xs font-bold text-ink-muted mb-2">全体</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-xl overflow-hidden mb-4">
        {metrics.map((m) => {
          const inner = (
            <>
              <p className="text-xs text-ink-muted flex items-center gap-1">
                {m.label}
                {m.href && <ChevronRight size={12} />}
              </p>
              <p className="mt-1.5 text-xl sm:text-2xl font-bold text-ink tabular-nums break-all">
                {m.value}
              </p>
            </>
          );
          return m.href ? (
            <Link
              key={m.label}
              href={m.href}
              className="bg-white px-5 py-4 hover:bg-cream-50 transition-colors"
            >
              {inner}
            </Link>
          ) : (
            <div key={m.label} className="bg-white px-5 py-4">
              {inner}
            </div>
          );
        })}
      </div>

      <dl className="flex flex-wrap gap-x-8 gap-y-2 px-1 text-sm">
        {statusCounts.map((s) => (
          <div key={s.label} className="flex items-baseline gap-2">
            <dt className="text-ink-muted">{s.label}</dt>
            <dd className="font-bold text-ink tabular-nums">{formatNumber(s.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
