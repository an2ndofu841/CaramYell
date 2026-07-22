"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  ExternalLink,
  Check,
  X,
  ShieldCheck,
  AlertTriangle,
  Clock,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Project, Category, Profile } from "@/types";

interface ReviewProject extends Project {
  profiles?: Profile;
  categories?: Category;
}

const tabs = [
  { key: "reviewing", label: "審査中" },
  { key: "active", label: "掲載中" },
  { key: "cancelled", label: "却下" },
];

export default function AdminReviewClient() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [statusTab, setStatusTab] = useState("reviewing");
  const [projects, setProjects] = useState<ReviewProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ReviewProject | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchProjects = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/projects?status=${status}`);
      if (res.status === 401) {
        router.push("/auth/login?redirect=/dashboard/admin");
        return;
      }
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login?redirect=/dashboard/admin");
      return;
    }
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchProjects(statusTab);
  }, [user, isAdmin, authLoading, statusTab, router, fetchProjects]);

  const review = async (
    project: ReviewProject,
    action: "approve" | "reject",
    reason?: string
  ) => {
    setBusyId(project.id);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "処理に失敗しました");
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      toast.success(action === "approve" ? "承認しました 🎉" : "却下しました");
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || (!isAdmin && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-candy-pink" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen pt-20" style={{ background: "#FFFBF5" }}>
      <div
        className="py-8"
        style={{ background: "linear-gradient(135deg, #4A2C17 0%, #31200E 100%)" }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <ShieldCheck size={24} />
            プロジェクト審査
          </h1>
          <p className="text-white/50 text-sm">
            申請されたプロジェクトを承認・却下します（管理者専用）
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ステータスタブ */}
        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatusTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                statusTab === t.key
                  ? "text-white shadow-sm"
                  : "bg-white text-gray-500 hover:bg-caramel-50 border-2 border-caramel-100"
              }`}
              style={
                statusTab === t.key
                  ? { background: "linear-gradient(135deg, #F2807B, #F5A34B)" }
                  : {}
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 size={28} className="animate-spin text-candy-pink mx-auto" />
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🗂️</div>
              <p className="font-bold text-gray-700">
                {statusTab === "reviewing"
                  ? "審査待ちのプロジェクトはありません"
                  : "該当するプロジェクトはありません"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card hover>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-24 h-20 rounded-2xl overflow-hidden bg-caramel-100 flex-shrink-0 flex items-center justify-center text-3xl">
                      {project.main_image_url ? (
                        <img
                          src={project.main_image_url}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        project.categories?.icon || "📋"
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-800 line-clamp-2">
                          {project.title}
                        </h3>
                        {project.categories && (
                          <Badge color="caramel" size="sm">
                            {project.categories.name_ja}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                        {project.tagline}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span>
                          作成者:{" "}
                          <strong className="text-gray-600">
                            {project.profiles?.display_name || "—"}
                          </strong>
                        </span>
                        <span>目標: {formatCurrency(project.goal_amount)}</span>
                        {project.submitted_at && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(project.submitted_at).toLocaleString("ja-JP")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-caramel-100">
                    {project.preview_token && (
                      <Link
                        href={`/projects/preview/${project.preview_token}`}
                        target="_blank"
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 border-2 border-caramel-100 hover:bg-caramel-50 transition-colors"
                      >
                        <ExternalLink size={14} />
                        内容をプレビュー
                      </Link>
                    )}

                    {statusTab === "reviewing" && (
                      <div className="flex gap-2 ml-auto">
                        <button
                          onClick={() => setRejectTarget(project)}
                          disabled={busyId === project.id}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-500 border-2 border-red-100 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <X size={14} />
                          却下
                        </button>
                        <button
                          onClick={() => review(project, "approve")}
                          disabled={busyId === project.id}
                          className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, #34a853, #8FD4C4)" }}
                        >
                          {busyId === project.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          承認して掲載
                        </button>
                      </div>
                    )}
                    {statusTab === "cancelled" && project.rejection_reason && (
                      <span className="text-xs text-gray-400 ml-auto self-center">
                        却下理由: {project.rejection_reason}
                      </span>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 却下理由モーダル */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40"
          onClick={() => busyId === null && setRejectTarget(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-soft-lg max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-red-50 text-red-500">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1 text-center">
              却下しますか？
            </h3>
            <p className="text-sm text-gray-500 mb-4 text-center line-clamp-1 font-semibold">
              「{rejectTarget.title}」
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="却下理由（任意・作成者に表示できます）"
              rows={3}
              className="w-full px-3 py-2 rounded-xl border-2 border-caramel-100 text-sm outline-none focus:border-candy-pink transition-colors mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                disabled={busyId !== null}
                className="flex-1 py-3 rounded-2xl font-bold text-gray-500 border-2 border-caramel-100 hover:bg-caramel-50 transition-colors disabled:opacity-60"
              >
                やめる
              </button>
              <button
                onClick={() => review(rejectTarget, "reject", rejectReason)}
                disabled={busyId !== null}
                className="flex-1 py-3 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {busyId !== null ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <X size={18} />
                )}
                却下する
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
