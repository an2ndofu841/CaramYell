"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutGrid,
  ShieldCheck,
  FolderKanban,
  Users,
  Building2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { href: "/admin", label: "概要", icon: LayoutGrid, exact: true },
  { href: "/admin/applications", label: "掲載申請", icon: Building2, exact: false },
  { href: "/admin/review", label: "プロジェクト審査", icon: ShieldCheck, exact: false },
  { href: "/admin/projects", label: "プロジェクト", icon: FolderKanban, exact: false },
  { href: "/admin/users", label: "ユーザー", icon: Users, exact: false },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth/login?redirect=/admin");
    } else if (!isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, loading, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-52 flex-shrink-0">
            <div className="md:sticky md:top-24">
              <p className="px-3 mb-3 text-xs font-bold text-ink-muted tracking-wide">運営CMS</p>
              <nav className="flex md:flex-col gap-0.5 overflow-x-auto -mx-1 px-1">
                {nav.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 h-9 rounded-md text-sm whitespace-nowrap transition-colors",
                        active
                          ? "bg-white border border-line text-ink font-bold"
                          : "text-ink-soft hover:bg-cream-100 border border-transparent"
                      )}
                    >
                      <Icon size={15} className={active ? "text-ink" : "text-ink-muted"} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
