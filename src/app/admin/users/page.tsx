"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
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
      <h1 className="text-2xl font-bold text-gray-800 mb-1">ユーザー管理</h1>
      <p className="text-sm text-gray-500 mb-6">
        登録ユーザーの一覧と権限の設定。掲載者にするとプロジェクトを作成できるようになります。
      </p>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="メール・表示名で検索"
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-caramel-100 text-sm outline-none focus:border-candy-pink transition-colors"
        />
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 size={28} className="animate-spin text-candy-pink mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-center py-12 font-bold text-gray-500">
            ユーザーが見つかりません
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
            >
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #F2807B, #E8842C)" }}
                  >
                    {(u.display_name || u.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 text-sm truncate">
                        {u.display_name || "（名称未設定）"}
                      </p>
                      {u.role === "admin" && (
                        <Badge color="caramel" size="sm">管理者</Badge>
                      )}
                      {u.role === "creator" && (
                        <Badge color="mint" size="sm">掲載者</Badge>
                      )}
                      {u.id === selfId && (
                        <span className="text-[10px] text-gray-400">あなた</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      応援 {u.total_backed} · 作成 {u.total_created}
                    </p>
                  </div>

                  {u.id !== selfId && (
                    <div className="flex items-center gap-1 p-1 rounded-2xl bg-caramel-50 flex-shrink-0">
                      {busyId === u.id ? (
                        <div className="px-6 py-1.5">
                          <Loader2 size={14} className="animate-spin text-candy-pink" />
                        </div>
                      ) : (
                        ROLES.map((r) => (
                          <button
                            key={r.value}
                            onClick={() => setRole(u, r.value)}
                            title={r.note}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                              u.role === r.value
                                ? "bg-white text-caramel-600 shadow-sm"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            {r.label}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
