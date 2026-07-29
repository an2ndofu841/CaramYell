"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Loader2,
  ChevronRight,
  FileEdit,
} from "lucide-react";
import Card from "@/components/ui/Card";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Stats {
  reviewing: number;
  active: number;
  funded: number;
  completed: number;
  draft: number;
  users: number;
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
      <div className="py-16 text-center">
        <Loader2 size={28} className="animate-spin text-candy-pink mx-auto" />
      </div>
    );
  }

  const cards = [
    { label: "審査待ち", value: `${stats?.reviewing ?? 0}件`, icon: <Clock size={20} />, color: "#F2807B", href: "/admin/review" },
    { label: "掲載中", value: `${stats?.active ?? 0}件`, icon: <TrendingUp size={20} />, color: "#8FD4C4", href: "/admin/projects" },
    { label: "登録ユーザー", value: `${formatNumber(stats?.users ?? 0)}人`, icon: <Users size={20} />, color: "#F5A34B", href: "/admin/users" },
    { label: "流通総額", value: formatCurrency(stats?.gmv ?? 0), icon: <DollarSign size={20} />, color: "#C9A87C" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">概要</h1>
      <p className="text-sm text-gray-500 mb-6">サービス全体の状況</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c, i) => {
          const inner = (
            <Card hover={!!c.href}>
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white mb-3"
                style={{ background: c.color }}
              >
                {c.icon}
              </div>
              <p className="text-2xl font-bold text-gray-800">{c.value}</p>
              <p className="text-xs text-gray-400 font-medium mt-1 flex items-center gap-1">
                {c.label}
                {c.href && <ChevronRight size={12} />}
              </p>
            </Card>
          );
          return c.href ? (
            <Link key={i} href={c.href}>
              {inner}
            </Link>
          ) : (
            <div key={i}>{inner}</div>
          );
        })}
      </div>

      {(stats?.reviewing ?? 0) > 0 && (
        <Link href="/admin/review">
          <Card hover>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #F2807B, #F5A34B)" }}>
                <FileEdit size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">
                  {stats?.reviewing}件のプロジェクトが審査待ちです
                </p>
                <p className="text-xs text-gray-400">クリックして審査へ</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        {[
          { label: "達成", value: stats?.funded ?? 0 },
          { label: "完了", value: stats?.completed ?? 0 },
          { label: "下書き", value: stats?.draft ?? 0 },
          { label: "累計支援者", value: stats?.totalBackers ?? 0 },
        ].map((s, i) => (
          <Card key={i}>
            <p className="text-xl font-bold text-gray-800">{formatNumber(s.value)}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
