"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutGrid,
  ShieldCheck,
  FolderKanban,
  Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { href: "/admin", label: "概要", icon: LayoutGrid, exact: true },
  { href: "/admin/review", label: "審査", icon: ShieldCheck, exact: false },
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
        <Loader2 size={32} className="animate-spin text-candy-pink" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: "#FFFBF5" }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* サイドバー */}
          <aside className="md:w-56 flex-shrink-0">
            <div className="md:sticky md:top-24">
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <ShieldCheck size={18} className="text-caramel-500" />
                <span className="font-black text-gray-800">運営CMS</span>
              </div>
              <nav className="flex md:flex-col gap-1 overflow-x-auto">
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
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-colors",
                        active
                          ? "text-white shadow-sm"
                          : "text-gray-600 hover:bg-caramel-50"
                      )}
                      style={
                        active
                          ? { background: "linear-gradient(135deg, #F2807B, #F5A34B)" }
                          : {}
                      }
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* コンテンツ */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
