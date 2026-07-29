"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Search, Star, Eye, ExternalLink } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, getStatusLabel } from "@/lib/utils";
import { toast } from "sonner";
import type { Project, Category, Profile } from "@/types";

interface AdminProject extends Project {
  profiles?: Profile;
  categories?: Category;
}

const filters = [
  { key: "all", label: "すべて" },
  { key: "active", label: "掲載中" },
  { key: "reviewing", label: "審査中" },
  { key: "draft", label: "下書き" },
  { key: "funded", label: "達成" },
  { key: "completed", label: "完了" },
  { key: "cancelled", label: "却下/中止" },
];

const statusColorMap: Record<string, "pink" | "caramel" | "mint" | "lemon" | "sky" | "gray"> = {
  pink: "pink", green: "mint", yellow: "lemon", blue: "sky", red: "pink", gray: "gray",
};

export default function AdminProjectsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchProjects = useCallback(async (status: string, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status });
      if (q) params.set("search", q);
      const res = await fetch(`/api/admin/projects?${params}`);
      const data = await res.json();
      if (res.ok) setProjects(data.projects || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchProjects(statusFilter, search), 300);
    return () => clearTimeout(t);
  }, [statusFilter, search, fetchProjects]);

  const patch = async (project: AdminProject, body: Record<string, unknown>) => {
    setBusyId(project.id);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "更新に失敗しました");
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, ...data.project } : p))
      );
      toast.success("更新しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">プロジェクト管理</h1>
      <p className="text-sm text-gray-500 mb-6">
        全プロジェクトの検索・ステータス変更・特集設定
      </p>

      {/* 検索 */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="タイトルで検索"
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-caramel-100 text-sm outline-none focus:border-candy-pink transition-colors"
        />
      </div>

      {/* フィルタ */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === f.key
                ? "text-white shadow-sm"
                : "bg-white text-gray-500 hover:bg-caramel-50 border-2 border-caramel-100"
            }`}
            style={
              statusFilter === f.key
                ? { background: "linear-gradient(135deg, #F2807B, #F5A34B)" }
                : {}
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 size={28} className="animate-spin text-candy-pink mx-auto" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <p className="text-center py-12 font-bold text-gray-500">
            該当するプロジェクトはありません
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((project, i) => {
            const { label, color } = getStatusLabel(project.status);
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <Card>
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-12 rounded-xl overflow-hidden bg-caramel-100 flex-shrink-0 flex items-center justify-center text-xl">
                      {project.main_image_url ? (
                        <img src={project.main_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        project.categories?.icon || "📋"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge color={statusColorMap[color] || "gray"} size="sm">
                          {label}
                        </Badge>
                        {project.featured && (
                          <Badge color="lemon" size="sm">★ 特集</Badge>
                        )}
                        <span className="text-xs text-gray-400">
                          {project.profiles?.display_name || "—"}
                        </span>
                      </div>
                      <p className="font-bold text-gray-800 text-sm line-clamp-1">
                        {project.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatCurrency(project.current_amount || 0)} / {formatCurrency(project.goal_amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-caramel-100">
                    <Link
                      href={
                        ["active", "funded", "completed"].includes(project.status)
                          ? `/projects/${project.slug || project.id}`
                          : `/projects/preview/${project.preview_token}`
                      }
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-caramel-50 transition-colors"
                    >
                      {["active", "funded", "completed"].includes(project.status) ? (
                        <><Eye size={13} /> 表示</>
                      ) : (
                        <><ExternalLink size={13} /> プレビュー</>
                      )}
                    </Link>

                    <button
                      onClick={() => patch(project, { featured: !project.featured })}
                      disabled={busyId === project.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                        project.featured
                          ? "text-amber-600 bg-amber-50"
                          : "text-gray-500 hover:bg-caramel-50"
                      }`}
                    >
                      <Star size={13} className={project.featured ? "fill-amber-500 text-amber-500" : ""} />
                      {project.featured ? "特集を解除" : "特集にする"}
                    </button>

                    <select
                      value={project.status}
                      disabled={busyId === project.id}
                      onChange={(e) => patch(project, { status: e.target.value })}
                      className="ml-auto text-xs font-semibold border-2 border-caramel-100 rounded-lg px-2 py-1.5 outline-none focus:border-candy-pink bg-white disabled:opacity-50"
                    >
                      {["draft", "reviewing", "active", "funded", "failed", "completed", "cancelled"].map((s) => (
                        <option key={s} value={s}>
                          {getStatusLabel(s).label}
                        </option>
                      ))}
                    </select>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
