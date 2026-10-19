"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

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
  const { isCreator, organization } = useAuth();

  const tabs = [
    { href: "/dashboard", label: "応援した" },
    { href: "/dashboard/projects", label: "掲載中" },
    ...(organization
      ? [{ href: "/dashboard/organization", label: "事務所のメンバー" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-cream-50 pt-24 bg-[linear-gradient(180deg,#FCEEDC_0,#FFF9F1_220px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1
              className="text-2xl sm:text-3xl font-bold text-ink mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h1>
            <p className="text-sm text-ink-muted">{description}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/dashboard/settings">
              <Button variant="outline" size="md" icon={<Settings size={16} />}>
                <span className="hidden sm:inline">プロフィール設定</span>
              </Button>
            </Link>
            {actions}
          </div>
        </div>

        {isCreator ? (
          <nav className="flex gap-1 mt-6 border-b border-line">
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "px-3.5 py-2 -mb-px text-sm border-b-[3px] rounded-t-xl transition-colors",
                    active
                      ? "border-caramel-500 text-caramel-700 font-bold bg-caramel-50"
                      : "border-transparent text-ink-muted hover:text-ink hover:bg-caramel-50/60"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        ) : (
          <div className="mt-6 border-b border-line" />
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
    </div>
  );
}
