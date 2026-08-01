"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

/**
 * 支援者ダッシュボードと掲載者ダッシュボードで共通のヘッダー。
 * 掲載権限がある人にだけ2つを行き来するタブを出す。
 */
export default function DashboardShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isCreator } = useAuth();

  const tabs = [
    { href: "/dashboard", label: "応援した" },
    { href: "/dashboard/projects", label: "掲載中" },
  ];

  return (
    <div className="min-h-screen pt-20" style={{ background: "#FFFBF5" }}>
      <div
        className="pt-8"
        style={{ background: "linear-gradient(135deg, #4A2C17 0%, #31200E 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
              <p className="text-white/50 text-sm">{description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/settings">
                <Button variant="secondary" size="md" icon={<Settings size={18} />}>
                  <span className="hidden sm:inline">プロフィール設定</span>
                </Button>
              </Link>
              {actions}
            </div>
          </div>

          {isCreator && (
            <div className="flex gap-1 mt-6">
              {tabs.map((tab) => {
                const active = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`px-5 py-2.5 rounded-t-2xl text-sm font-bold transition-colors ${
                      active
                        ? "bg-[#FFFBF5] text-caramel-600"
                        : "text-white/60 hover:text-white/90"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          )}
          {!isCreator && <div className="h-8" />}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
    </div>
  );
}
