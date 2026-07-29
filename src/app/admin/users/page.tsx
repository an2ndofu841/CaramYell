"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, ShieldCheck, User as UserIcon } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  total_backed: number;
  total_created: number;
  created_at: string;
}

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

  const setRole = async (u: AdminUser, role: "user" | "admin") => {
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
      toast.success(role === "admin" ? "管理者に設定しました" : "一般ユーザーにしました");
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
        登録ユーザーの一覧・権限（管理者）の設定
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
                <div className="flex items-center gap-3">
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
                      {u.id === selfId && (
                        <span className="text-[10px] text-gray-400">あなた</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      応援 {u.total_backed} · 作成 {u.total_created}
                    </p>
                  </div>

                  {u.id !== selfId &&
                    (u.role === "admin" ? (
                      <button
                        onClick={() => setRole(u, "user")}
                        disabled={busyId === u.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 border-2 border-caramel-100 hover:bg-caramel-50 transition-colors disabled:opacity-50"
                      >
                        {busyId === u.id ? <Loader2 size={13} className="animate-spin" /> : <UserIcon size={13} />}
                        管理者を解除
                      </button>
                    ) : (
                      <button
                        onClick={() => setRole(u, "admin")}
                        disabled={busyId === u.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #C9A87C, #8FD4C4)" }}
                      >
                        {busyId === u.id ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                        管理者にする
                      </button>
                    ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
