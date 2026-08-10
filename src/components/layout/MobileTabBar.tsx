"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/components/i18n/LocaleProvider";

export default function MobileTabBar() {
  const pathname = usePathname();
  const { user, isCreator } = useAuth();
  const t = useT();

  const baseTabs = [
    { href: "/", icon: Home, label: t.common.home, exact: true },
    { href: "/projects", icon: Search, label: t.common.search, exact: false },
  ];

  const createTab = { href: "/projects/create", icon: PlusCircle, label: t.common.createProject, exact: true };

  const tabs = isCreator ? [...baseTabs, createTab] : baseTabs;

  const myPageHref = user ? "/dashboard" : "/auth/login";

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href) && pathname !== "/projects/create";

  // プロジェクト詳細では、この位置を支援ボタンに明け渡す。2段になると
  // 画面をかなり食うので、いちばん取ってほしい行動だけを残す。
  // /projects（一覧）と /projects/create は対象外。
  const isProjectDetail =
    /^\/projects\/[^/]+/.test(pathname) && pathname !== "/projects/create";
  if (isProjectDetail) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-caramel-100 tabbar-safe"
      aria-label="モバイルナビゲーション"
    >
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 flex-1 transition-colors",
                active ? "text-caramel-500" : "text-gray-400"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
        <Link
          href={myPageHref}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 px-3 flex-1 transition-colors",
            pathname.startsWith("/dashboard") ? "text-caramel-500" : "text-gray-400"
          )}
        >
          <User size={22} strokeWidth={pathname.startsWith("/dashboard") ? 2.5 : 2} />
          <span className={cn("text-[10px]", pathname.startsWith("/dashboard") ? "font-bold" : "font-medium")}>
            {t.common.myPage}
          </span>
        </Link>
      </div>
    </nav>
  );
}
