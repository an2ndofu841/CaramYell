"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ImageIcon,
  Plus,
  Eye,
  Share2,
  ChevronRight,
  Loader2,
  Trash2,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import DashboardShell from "../DashboardShell";
import { cn, formatCurrency, formatNumber, getStatusLabel } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Project, Category, Reward } from "@/types";

interface DashboardProject extends Project {
  categories?: Category;
  rewards: Reward[];
  live_backer_count: number;
  live_current_amount: number;
}

export default function CreatorDashboardClient() {
  const router = useRouter();
  const { user, organization, isCreator, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DashboardProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/projects");
      if (res.status === 401) {
        router.push("/auth/login?redirect=/dashboard");
        return;
      }
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/dashboard/projects/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "削除に失敗しました");
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("プロジェクトを削除しました");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login?redirect=/dashboard/projects");
      return;
    }
    // 掲載権限がない人にはこの画面自体を見せず、応援側に戻す
    if (!isCreator) {
      router.replace("/dashboard");
      return;
    }
    fetchProjects();
  }, [user, isCreator, authLoading, router, fetchProjects]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <Loader2 size={24} className="animate-spin text-ink-muted mx-auto mb-3" />
          <p className="text-sm text-ink-muted">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user || !isCreator) return null;

  const activeProjects = projects.filter((p) =>
    ["active", "funded"].includes(p.status)
  );
  const totalRaised = projects.reduce(
    (s, p) => s + (p.live_current_amount || p.current_amount || 0),
    0
  );
  const totalBackers = projects.reduce(
    (s, p) => s + (p.live_backer_count || p.backer_count || 0),
    0
  );

  const statusBadge = (status: string) => {
    const { label, color } = getStatusLabel(status);
    const colorMap: Record<string, "pink" | "caramel" | "mint" | "lavender" | "lemon" | "sky" | "gray"> = {
      pink: "pink",
      green: "mint",
      yellow: "lemon",
      blue: "sky",
      red: "pink",
      gray: "gray",
    };
    return (
      <Badge color={colorMap[color] || "gray"} size="sm">
        {label}
      </Badge>
    );
  };

  const summary = [
    { label: "累計支援金額", value: formatCurrency(totalRaised) },
    { label: "合計支援者数", value: `${formatNumber(totalBackers)}人` },
    { label: "掲載中プロジェクト", value: `${activeProjects.length}件` },
    { label: "全プロジェクト", value: `${projects.length}件` },
  ];

  // 事務所のプロジェクトを消せるのは作成者本人かオーナーだけ（API と同じ判定）
  const canDelete = (project: DashboardProject) =>
    project.organization_id
      ? organization?.id === project.organization_id &&
        (organization.role === "owner" || project.creator_id === user.id)
      : project.creator_id === user.id;

  const actionClass =
    "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-ink-muted hover:bg-cream-50 hover:text-ink transition-colors";

  return (
    <DashboardShell
      title="掲載中のプロジェクト"
      description={
        organization
          ? `${organization.name} のプロジェクトを、事務所のメンバーで管理できます`
          : "支援の状況と支援者を確認・管理できます"
      }
      actions={
        <Link href="/projects/create">
          <Button icon={<Plus size={16} />} size="md">
            <span className="hidden sm:inline">新規作成</span>
          </Button>
        </Link>
      }
    >
      <>
        {/* サマリー */}
        <dl className="grid grid-cols-2 lg:grid-cols-4 rounded-xl border border-line bg-white mb-8 overflow-hidden">
          {summary.map((item, i) => (
            <div
              key={item.label}
              className={cn(
                "px-4 sm:px-6 py-4 sm:py-5 min-w-0 border-line",
                i % 2 === 1 && "border-l",
                i >= 2 && "border-t lg:border-t-0",
                i === 2 && "lg:border-l"
              )}
            >
              <dt className="text-xs font-bold text-ink-muted mb-1 truncate">
                {item.label}
              </dt>
              <dd className="text-xl sm:text-2xl font-bold text-ink tabular-nums truncate">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* プロジェクト一覧 */}
        {projects.length === 0 ? (
          <div className="rounded-xl border border-line bg-white px-6 py-14 text-center">
            <h2
              className="text-lg font-bold text-ink mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              まだプロジェクトはありません
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed mb-6">
              作成したプロジェクトはここに並び、支援の状況や支援者を管理できます。
            </p>
            <Link href="/projects/create">
              <Button icon={<Plus size={16} />}>プロジェクトを作成する</Button>
            </Link>
          </div>
        ) : (
          <section>
            <h2 className="text-xs font-bold text-ink-muted mb-3">プロジェクト</h2>
            <div className="space-y-3">
              {projects.map((project) => {
                const amount =
                  project.live_current_amount || project.current_amount || 0;
                const backers =
                  project.live_backer_count || project.backer_count || 0;
                const progress = Math.min(
                  Math.round((amount / (project.goal_amount || 1)) * 100),
                  100
                );
                const daysLeft = project.end_date
                  ? Math.max(
                      0,
                      Math.ceil(
                        (new Date(project.end_date).getTime() - Date.now()) /
                          86400000
                      )
                    )
                  : 0;
                const isEditable = ["draft", "reviewing", "cancelled"].includes(
                  project.status
                );

                return (
                  <article
                    key={project.id}
                    className="rounded-xl border border-line bg-white"
                  >
                    <div className="p-4 sm:p-5 flex gap-4">
                      <div className="w-20 h-16 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0 flex items-center justify-center text-ink-faint">
                        {project.main_image_url ? (
                          <img
                            src={project.main_image_url}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon size={18} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-ink text-sm line-clamp-2 leading-snug">
                            {project.title}
                          </h3>
                          {statusBadge(project.status)}
                        </div>

                        <ProgressBar percentage={progress} className="mb-2" />

                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-ink-muted">
                          <span className="tabular-nums">
                            <strong className="font-bold text-ink">
                              {formatCurrency(amount)}
                            </strong>{" "}
                            / {formatCurrency(project.goal_amount)}
                          </span>
                          <span className="tabular-nums">
                            {backers}人が応援 · 残り{daysLeft}日
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex border-t border-line divide-x divide-line">
                      <Link
                        href={`/projects/${project.slug || project.id}`}
                        className={cn(actionClass, "rounded-bl-xl")}
                      >
                        <Eye size={14} />
                        プレビュー
                      </Link>
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className={cn(actionClass, "text-ink font-bold")}
                      >
                        管理する
                        <ChevronRight size={14} />
                      </Link>
                      {isEditable ? (
                        // 未公開のうちは画像・目標金額・リターンまで作成画面で直せる。
                        // シェアはまだ意味がないので入れ替える。
                        <Link
                          href={`/projects/create?id=${project.id}`}
                          className={actionClass}
                        >
                          <Pencil size={14} />
                          編集を続ける
                        </Link>
                      ) : (
                        <button className={actionClass}>
                          <Share2 size={14} />
                          シェア
                        </button>
                      )}
                      {canDelete(project) && (
                        <button
                          onClick={() => setDeleteTarget(project)}
                          aria-label="削除"
                          className="flex-shrink-0 flex items-center justify-center px-4 py-2.5 text-ink-muted hover:bg-red-50 hover:text-red-600 transition-colors rounded-br-xl"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* 削除確認モーダル */}
        {deleteTarget && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="bg-white rounded-xl border border-line max-w-sm w-full p-6 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-ink mb-2 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
                プロジェクトを削除しますか？
              </h3>
              <p className="text-sm text-ink-soft mb-1 line-clamp-2 font-semibold">
                「{deleteTarget.title}」
              </p>
              <p className="text-xs text-ink-muted mb-6">
                この操作は取り消せません。リターン・活動報告なども削除されます。
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                >
                  キャンセル
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={handleDelete}
                  loading={isDeleting}
                  icon={<Trash2 size={16} />}
                >
                  削除する
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    </DashboardShell>
  );
}
