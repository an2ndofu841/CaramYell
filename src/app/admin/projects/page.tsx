"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Search, Star, Eye, ExternalLink, ImageIcon } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { cn, formatCurrency, getStatusLabel } from "@/lib/utils";
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

// getStatusLabel の色名を Badge の色に読み替える。達成は緑、審査中は注意色、掲載中はアクセント色
const statusColorMap: Record<string, "pink" | "caramel" | "mint" | "lemon" | "sky" | "gray"> = {
  pink: "mint", green: "caramel", yellow: "lemon", blue: "sky", red: "gray", gray: "gray",
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
      <h1 className="text-2xl font-bold text-ink mb-1">プロジェクト</h1>
      <p className="text-sm text-ink-muted mb-6">
        全プロジェクトの検索・ステータス変更・特集設定
      </p>

      {/* 検索 */}
      <div className="mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="タイトルで検索"
          icon={<Search size={16} />}
          fullWidth
        />
      </div>

      {/* フィルタ */}
      <div className="flex gap-1 mb-6 border-b border-line overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              "px-3 py-2 -mb-px text-sm whitespace-nowrap border-b-2 transition-colors",
              statusFilter === f.key
                ? "border-ink text-ink font-bold"
                : "border-transparent text-ink-muted hover:text-ink"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 size={24} className="animate-spin text-ink-muted" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-line bg-white py-16 text-center text-sm text-ink-muted">
          該当するプロジェクトはありません
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-white divide-y divide-line">
          {projects.map((project) => {
            const { label, color } = getStatusLabel(project.status);
            const isPublic = ["active", "funded", "completed"].includes(project.status);
            return (
              <div key={project.id} className="p-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-11 rounded-md overflow-hidden bg-cream-100 flex-shrink-0 flex items-center justify-center">
                    {project.main_image_url ? (
                      <img src={project.main_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={16} className="text-ink-faint" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge color={statusColorMap[color] || "gray"} size="sm">
                        {label}
                      </Badge>
                      {project.featured && (
                        <Badge color="new" size="sm">
                          <Star size={10} className="fill-current" />
                          特集
                        </Badge>
                      )}
                      <span className="text-xs text-ink-muted">
                        {project.profiles?.display_name || "—"}
                      </span>
                    </div>
                    <p className="font-bold text-ink text-sm line-clamp-1">{project.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                      {formatCurrency(project.current_amount || 0)} / {formatCurrency(project.goal_amount)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3 sm:pl-[4.25rem]">
                  <Link
                    href={
                      isPublic
                        ? `/projects/${project.slug || project.id}`
                        : `/projects/preview/${project.preview_token}`
                    }
                    target="_blank"
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-semibold text-ink-soft hover:bg-cream-100 transition-colors"
                  >
                    {isPublic ? (
                      <><Eye size={13} /> 表示</>
                    ) : (
                      <><ExternalLink size={13} /> プレビュー</>
                    )}
                  </Link>

                  <button
                    onClick={() => patch(project, { featured: !project.featured })}
                    disabled={busyId === project.id}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50",
                      project.featured
                        ? "text-ink bg-cream-100 hover:bg-cream-200"
                        : "text-ink-soft hover:bg-cream-100"
                    )}
                  >
                    <Star size={13} className={project.featured ? "fill-current" : ""} />
                    {project.featured ? "特集を解除" : "特集にする"}
                  </button>

                  <select
                    value={project.status}
                    disabled={busyId === project.id}
                    onChange={(e) => patch(project, { status: e.target.value })}
                    className="ml-auto h-8 text-xs font-semibold text-ink border border-line-strong rounded-md px-2 outline-none focus:border-ink bg-white disabled:opacity-50"
                  >
                    {["draft", "reviewing", "active", "funded", "failed", "completed", "cancelled"].map((s) => (
                      <option key={s} value={s}>
                        {getStatusLabel(s).label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
