"use client";

import { useState, useEffect } from "react";
import { Loader2, Search } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { UserRole } from "@/types";

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  total_backed: number;
  total_created: number;
  created_at: string;
}

const ROLES: { value: UserRole; label: string; note: string }[] = [
  { value: "user", label: "支援者", note: "応援のみ" },
  { value: "creator", label: "掲載者", note: "プロジェクトを掲載できる" },
  { value: "admin", label: "管理者", note: "運営CMSを使える" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (res.ok) {
          setUsers(data.users || []);
          setSelfId(data.selfId || null);
        } else {
          toast.error(data.error || "取得に失敗しました");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setRole = async (u: AdminUser, role: UserRole) => {
    if (u.role === role) return;
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "更新に失敗しました");
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
      const label = ROLES.find((r) => r.value === role)?.label ?? role;
      toast.success(`${label}に設定しました`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">ユーザー</h1>
      <p className="text-sm text-ink-muted mb-6">
        登録ユーザーの一覧と権限の設定。掲載者にするとプロジェクトを作成できるようになります。
      </p>

      <div className="mb-6">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="メール・表示名で検索"
          icon={<Search size={16} />}
          fullWidth
        />
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 size={24} className="animate-spin text-ink-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-white py-16 text-center text-sm text-ink-muted">
          ユーザーが見つかりません
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-white divide-y divide-line">
          {filtered.map((u) => (
            <div key={u.id} className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-cream-100 text-ink-soft text-sm font-bold flex-shrink-0">
                  {(u.display_name || u.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-ink text-sm truncate">
                      {u.display_name || "（名称未設定）"}
                    </p>
                    {u.role === "admin" && (
                      <Badge color="hot" size="sm">管理者</Badge>
                    )}
                    {u.role === "creator" && (
                      <Badge color="caramel" size="sm">掲載者</Badge>
                    )}
                    {u.id === selfId && (
                      <span className="text-[11px] text-ink-muted">あなた</span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted truncate">{u.email}</p>
                  <p className="text-[11px] text-ink-muted mt-0.5 tabular-nums">
                    応援 {u.total_backed} · 作成 {u.total_created}
                  </p>
                </div>
              </div>

              {u.id !== selfId && (
                <div className="flex items-center rounded-lg border border-line-strong overflow-hidden flex-shrink-0 self-start sm:self-auto">
                  {busyId === u.id ? (
                    <div className="h-8 w-[12.5rem] flex items-center justify-center">
                      <Loader2 size={14} className="animate-spin text-ink-muted" />
                    </div>
                  ) : (
                    ROLES.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setRole(u, r.value)}
                        title={r.note}
                        className={cn(
                          "h-8 px-3 text-xs font-bold transition-colors border-l border-line-strong first:border-l-0",
                          u.role === r.value
                            ? "bg-ink text-white"
                            : "bg-white text-ink-muted hover:text-ink hover:bg-cream-100"
                        )}
                      >
                        {r.label}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
