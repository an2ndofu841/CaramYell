"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, ExternalLink, Check, Clock, ImageIcon } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { cn, formatCurrency } from "@/lib/utils";
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

export default function AdminReviewPage() {
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
      const data = await res.json();
      if (res.ok) setProjects(data.projects || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects(statusTab);
  }, [statusTab, fetchProjects]);

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
      toast.success(action === "approve" ? "承認しました" : "却下しました");
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">プロジェクト審査</h1>
      <p className="text-sm text-ink-muted mb-6">
        申請されたプロジェクトを承認・却下します
      </p>

      <div className="flex gap-1 mb-6 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatusTab(t.key)}
            className={cn(
              "px-3 py-2 -mb-px text-sm border-b-2 transition-colors",
              statusTab === t.key
                ? "border-ink text-ink font-bold"
                : "border-transparent text-ink-muted hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 size={24} className="animate-spin text-ink-muted" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-line bg-white py-16 text-center text-sm text-ink-muted">
          {statusTab === "reviewing"
            ? "審査待ちのプロジェクトはありません"
            : "該当するプロジェクトはありません"}
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <article key={project.id} className="rounded-xl border border-line bg-white">
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-28 aspect-[16/10] sm:aspect-auto sm:h-20 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0 flex items-center justify-center">
                  {project.main_image_url ? (
                    <img
                      src={project.main_image_url}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={20} className="text-ink-faint" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-ink line-clamp-2">{project.title}</h3>
                    {project.categories && (
                      <Badge color="gray" size="sm" className="flex-shrink-0">
                        {project.categories.name_ja}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-ink-soft line-clamp-2 mb-2">{project.tagline}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                    <span>
                      作成者:{" "}
                      <strong className="text-ink">
                        {project.profiles?.display_name || "—"}
                      </strong>
                    </span>
                    <span className="tabular-nums">目標: {formatCurrency(project.goal_amount)}</span>
                    {project.submitted_at && (
                      <span className="flex items-center gap-1 tabular-nums">
                        <Clock size={12} />
                        {new Date(project.submitted_at).toLocaleString("ja-JP")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 px-5 sm:px-6 py-3 border-t border-line bg-cream-50 rounded-b-xl">
                {project.preview_token && (
                  <Link
                    href={`/projects/preview/${project.preview_token}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-bold text-ink border border-line-strong bg-white hover:bg-cream-100 transition-colors"
                  >
                    <ExternalLink size={13} />
                    内容をプレビュー
                  </Link>
                )}

                {statusTab === "reviewing" && (
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectTarget(project)}
                      disabled={busyId === project.id}
                      className="text-red-600"
                    >
                      却下
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => review(project, "approve")}
                      loading={busyId === project.id}
                      icon={<Check size={14} />}
                    >
                      承認して掲載
                    </Button>
                  </div>
                )}
                {statusTab === "cancelled" && project.rejection_reason && (
                  <span className="text-xs text-ink-muted ml-auto">
                    却下理由: {project.rejection_reason}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {rejectTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40"
          onClick={() => busyId === null && setRejectTarget(null)}
        >
          <div
            className="bg-white rounded-xl border border-line max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-ink mb-1">却下しますか？</h3>
            <p className="text-sm text-ink-muted mb-4 line-clamp-1">「{rejectTarget.title}」</p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="却下理由（任意）"
              rows={3}
              className="text-sm"
            />
            <div className="flex gap-2 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setRejectTarget(null)}
                disabled={busyId !== null}
              >
                やめる
              </Button>
              <Button
                variant="danger"
                onClick={() => review(rejectTarget, "reject", rejectReason)}
                loading={busyId !== null}
              >
                却下する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
