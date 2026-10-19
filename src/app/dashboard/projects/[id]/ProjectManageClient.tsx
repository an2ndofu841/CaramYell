"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Gift,
  Save,
  Plus,
  Trash2,
  Send,
  Eye,
  EyeOff,
  Loader2,
  Calendar,
  Mail,
  MapPin,
  Package,
  Smartphone,
  Star,
  Banknote,
  Undo2,
  Flower2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import FulfillmentTab from "@/components/dashboard/FulfillmentTab";
import DesignTab from "@/components/dashboard/DesignTab";
import GoalsTab from "@/components/dashboard/GoalsTab";
import OfflineBackingForm from "@/components/dashboard/OfflineBackingForm";
import NameCreditPanel from "@/components/dashboard/NameCreditPanel";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Input";
import Markdown from "@/components/ui/Markdown";
import MarkdownEditor from "@/components/ui/MarkdownEditor";
import ProgressBar from "@/components/ui/ProgressBar";
import EnglishPanel from "@/components/project/EnglishPanel";
import FaqEditor from "@/components/project/FaqEditor";
import {
  canEditSlug,
  normalizeSlug,
  normalizeSlugInput,
  slugError,
} from "@/lib/project/slug";
import {
  formatCurrency,
  formatNumber,
  getStatusLabel,
  timeAgo,
  cn,
} from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Project, Reward, Backer, ProjectUpdate } from "@/types";

/** 公開URLのプレビュー用。プロトコルまで見せる必要はない */
const SITE_HOST = (process.env.NEXT_PUBLIC_APP_URL || "https://caramyell.com")
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");

type Tab =
  | "overview"
  | "edit"
  | "goals"
  | "design"
  | "backers"
  | "fulfillment"
  | "rewards"
  | "updates";

interface ProjectStats {
  totalRaised: number;
  totalBackers: number;
  avgBacking: number;
  progressPercentage: number;
  daysLeft: number;
}

export default function ProjectManageClient() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [backers, setBackers] = useState<Backer[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/projects/${projectId}`);
      if (res.status === 401) {
        router.push("/auth/login?redirect=/dashboard");
        return;
      }
      if (res.status === 404) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setProject(data.project);
      setBackers(data.backers || []);
      setUpdates(data.updates || []);
      setStats(data.stats);
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/dashboard");
      return;
    }
    if (user) fetchData();
  }, [user, authLoading, router, fetchData]);

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

  if (!project || !stats) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "概要" },
    { id: "edit", label: "編集" },
    { id: "goals", label: "ゴール" },
    { id: "design", label: "デザイン" },
    { id: "backers", label: "支援者" },
    { id: "fulfillment", label: "発送管理" },
    { id: "rewards", label: "リターン" },
    { id: "updates", label: "活動報告" },
  ];

  const { label: statusLabel } = getStatusLabel(project.status);

  return (
    <div className="min-h-screen bg-cream-50 pt-24">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          ダッシュボードに戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
              <h1
                className="text-xl sm:text-2xl font-bold text-ink min-w-0 break-words"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {project.title}
              </h1>
              <Badge
                color={
                  project.status === "active"
                    ? "mint"
                    : project.status === "funded"
                    ? "pink"
                    : "gray"
                }
                size="sm"
              >
                {statusLabel}
              </Badge>
            </div>
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-ink-muted tabular-nums">
              <span className="font-bold text-ink">{formatCurrency(stats.totalRaised)}</span>
              <span aria-hidden>·</span>
              <span>{stats.totalBackers}人</span>
              <span aria-hidden>·</span>
              <span>残り{stats.daysLeft}日</span>
            </p>
          </div>
          <Link
            href={`/projects/${project.slug || project.id}`}
            className="flex-shrink-0"
          >
            <Button variant="outline" size="sm" icon={<Eye size={14} />}>
              プレビュー
            </Button>
          </Link>
        </div>

        {/* Progress */}
        <div className="mt-4 max-w-xl">
          <ProgressBar percentage={stats.progressPercentage} color="candy" />
          <p className="text-xs text-ink-muted mt-1 tabular-nums">
            {stats.progressPercentage}% 達成
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-line bg-cream-50 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-3 text-sm border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-ink text-ink font-bold"
                    : "border-transparent text-ink-muted hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <OverviewTab
            project={project}
            stats={stats}
            backers={backers}
            updates={updates}
          />
        )}
        {activeTab === "edit" && (
          <EditTab project={project} onSaved={fetchData} />
        )}
        {activeTab === "goals" && (
          <GoalsTab project={project} onChanged={fetchData} />
        )}
        {activeTab === "design" && (
          <DesignTab project={project} onSaved={fetchData} />
        )}
        {activeTab === "backers" && (
          <BackersTab backers={backers} project={project} onChanged={fetchData} />
        )}
        {activeTab === "fulfillment" && (
          <FulfillmentTab
            projectId={projectId}
            projectTitle={project.title}
            backers={backers}
            rewards={project.rewards || []}
            onUpdated={(updated) =>
              setBackers((prev) =>
                prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
              )
            }
          />
        )}
        {activeTab === "rewards" && (
          <RewardsTab
            project={project}
            onChanged={fetchData}
          />
        )}
        {activeTab === "updates" && (
          <UpdatesTab
            projectId={project.id}
            updates={updates}
            onPosted={fetchData}
          />
        )}
      </div>
    </div>
  );
}

/* ================ Overview Tab ================ */
function OverviewTab({
  project,
  stats,
  backers,
  updates,
}: {
  project: Project;
  stats: ProjectStats;
  backers: Backer[];
  updates: ProjectUpdate[];
}) {
  const paidBackers = backers
    .filter((b) => b.status === "paid")
    .slice(0, 5);

  const summary = [
    { label: "支援金額", value: formatCurrency(stats.totalRaised) },
    { label: "支援者数", value: `${stats.totalBackers}人` },
    { label: "達成率", value: `${stats.progressPercentage}%` },
    { label: "平均支援額", value: formatCurrency(stats.avgBacking) },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Stats */}
        <dl className="grid grid-cols-2 sm:grid-cols-4 rounded-xl border border-line bg-white overflow-hidden">
          {summary.map((item, i) => (
            <div
              key={item.label}
              className={cn(
                "px-4 sm:px-5 py-4 min-w-0 border-line",
                i % 2 === 1 && "border-l",
                i >= 2 && "border-t sm:border-t-0",
                i === 2 && "sm:border-l"
              )}
            >
              <dt className="text-xs font-bold text-ink-muted mb-1 truncate">{item.label}</dt>
              <dd className="text-xl font-bold text-ink tabular-nums truncate">{item.value}</dd>
            </div>
          ))}
        </dl>

        {/* Project Info */}
        <Card className="rounded-xl">
          <h3 className="text-sm font-bold text-ink mb-2">プロジェクト情報</h3>
          <dl className="divide-y divide-line">
            <InfoRow label="目標金額" value={formatCurrency(project.goal_amount)} />
            <InfoRow label="掲載終了日" value={project.end_date ? new Date(project.end_date).toLocaleDateString("ja-JP") : "未設定"} />
            <InfoRow label="リターン数" value={`${project.rewards?.length || 0}種類`} />
            <InfoRow label="作成日" value={new Date(project.created_at).toLocaleDateString("ja-JP")} />
          </dl>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card className="rounded-xl" padding="none">
          <h3 className="text-sm font-bold text-ink px-5 pt-5 pb-3">最新の応援</h3>
          {paidBackers.length === 0 ? (
            <p className="text-sm text-ink-muted px-5 pb-5">
              まだ応援はありません
            </p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {paidBackers.map((backer) => (
                <li key={backer.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink truncate">
                      {backer.is_anonymous ? "匿名" : backer.guest_nickname || "サポーター"}
                    </span>
                    <span className="text-sm font-bold text-ink tabular-nums">
                      {formatCurrency(backer.amount)}
                    </span>
                  </div>
                  {backer.message && (
                    <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">
                      {backer.message}
                    </p>
                  )}
                  <p className="text-xs text-ink-faint mt-0.5">
                    {timeAgo(backer.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="rounded-xl" padding="none">
          <h3 className="text-sm font-bold text-ink px-5 pt-5 pb-3">最新の活動報告</h3>
          {updates.length === 0 ? (
            <p className="text-sm text-ink-muted px-5 pb-5">
              まだ活動報告はありません
            </p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {updates.slice(0, 3).map((u) => (
                <li key={u.id} className="px-5 py-3">
                  <p className="text-sm font-semibold text-ink line-clamp-1">
                    {u.title}
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    {timeAgo(u.created_at)}
                    {u.is_backers_only && (
                      <span className="ml-2 text-caramel-700">支援者限定</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ================ Edit Tab ================ */
function EditTab({
  project,
  onSaved,
}: {
  project: Project;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: project.title,
    tagline: project.tagline,
    slug: project.slug || "",
    description: project.description,
    story: project.story || "",
    titleEn: project.title_en || "",
    taglineEn: project.tagline_en || "",
    descriptionEn: project.description_en || "",
    storyEn: project.story_en || "",
    faqs: Array.isArray(project.faqs) ? project.faqs : [],
  });
  const [saving, setSaving] = useState(false);

  // 公開後は共有済みのリンクが壊れるので変えさせない
  const slugEditable = canEditSlug(project.status);
  // 入力中は末尾のハイフンを許しているので、確定形で判定する
  const finalSlug = normalizeSlug(form.slug);
  const slugIssue = slugEditable ? slugError(finalSlug) : null;

  const handleSave = async () => {
    if (slugIssue) {
      alert(slugIssue);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // 公開後は送っても弾かれるので、変えられるときだけ載せる
        body: JSON.stringify(
          slugEditable ? { ...form, slug: finalSlug } : { ...form, slug: undefined }
        ),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: null }));
        throw new Error(error || "保存に失敗しました");
      }
      onSaved();
      alert("保存しました");
    } catch (e) {
      alert(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Card className="rounded-xl">
          <h3 className="text-lg font-bold text-ink mb-6">
            プロジェクト内容を編集
          </h3>

          <div className="space-y-5">
            <Input
              label="タイトル"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              fullWidth
            />

            <Textarea
              label="タグライン"
              value={form.tagline}
              onChange={(e) =>
                setForm((p) => ({ ...p, tagline: e.target.value }))
              }
              rows={2}
              fullWidth
            />

            <div>
              {slugEditable ? (
                <>
                  <Input
                    label="公開URL"
                    placeholder="例：scent-music-album"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        slug: normalizeSlugInput(e.target.value),
                      }))
                    }
                    error={slugIssue ?? undefined}
                    fullWidth
                    hint="半角英数字とハイフン。公開したあとは変更できません"
                  />
                  <p className="text-xs text-ink-muted mt-1.5 break-all">
                    {`${SITE_HOST}/projects/${finalSlug || "..."}`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-ink mb-1.5">
                    公開URL
                  </p>
                  <p className="text-sm text-ink-soft break-all">
                    {`${SITE_HOST}/projects/${project.slug || project.id}`}
                  </p>
                  <p className="text-xs text-ink-muted mt-1.5">
                    公開後は変更できません。共有済みのリンクが開けなくなるためです
                  </p>
                </>
              )}
            </div>

            <MarkdownEditor
              label="プロジェクト概要"
              value={form.description}
              onChange={(v) => setForm((p) => ({ ...p, description: v }))}
              rows={12}
              allowImages
            />

            <MarkdownEditor
              label="ストーリー"
              value={form.story}
              onChange={(v) => setForm((p) => ({ ...p, story: v }))}
              rows={10}
              allowImages
            />

            <EnglishPanel
              hasContent={Boolean(
                form.titleEn ||
                  form.taglineEn ||
                  form.descriptionEn ||
                  form.storyEn
              )}
            >
              <Input
                label="Title"
                value={form.titleEn}
                onChange={(e) =>
                  setForm((p) => ({ ...p, titleEn: e.target.value }))
                }
                fullWidth
              />
              <Textarea
                label="Tagline"
                value={form.taglineEn}
                onChange={(e) =>
                  setForm((p) => ({ ...p, taglineEn: e.target.value }))
                }
                rows={2}
                fullWidth
              />
              <MarkdownEditor
                label="Project overview"
                value={form.descriptionEn}
                onChange={(v) => setForm((p) => ({ ...p, descriptionEn: v }))}
                rows={10}
                allowImages
              />
              <MarkdownEditor
                label="Story"
                value={form.storyEn}
                onChange={(v) => setForm((p) => ({ ...p, storyEn: v }))}
                rows={8}
                allowImages
              />
            </EnglishPanel>

            <div className="pt-2 border-t border-line">
              <FaqEditor
                items={form.faqs}
                onChange={(faqs) => setForm((p) => ({ ...p, faqs }))}
              />
            </div>

            <Button
              onClick={handleSave}
              loading={saving}
              icon={<Save size={16} />}
              size="lg"
            >
              変更を保存する
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ================ Backers Tab ================ */
function BackersTab({
  backers,
  project,
  onChanged,
}: {
  backers: Backer[];
  project: Project;
  onChanged: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "paid" | "refunded">("all");
  const [showOfflineForm, setShowOfflineForm] = useState(false);
  const [showNameCredits, setShowNameCredits] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  // 現地支援を記録できるのは受付中だけ（終了後に総額が動くのを防ぐ）
  const canRecordOffline = project.status === "active" || project.status === "funded";

  const cancelOffline = async (backer: Backer) => {
    if (
      !confirm(
        `${backer.guest_nickname || "この支援者"} の現地支援 ${formatCurrency(
          backer.amount
        )} を取り消しますか？\n支援総額と支援者数から差し引かれます。`
      )
    )
      return;
    setCancellingId(backer.id);
    try {
      const res = await fetch(
        `/api/dashboard/projects/${project.id}/offline-backings?backerId=${backer.id}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "取り消しに失敗しました");
        return;
      }
      toast.success("現地支援を取り消しました");
      onChanged();
    } catch {
      toast.error("取り消しに失敗しました");
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = backers.filter((b) => {
    if (filter === "all") return true;
    return b.status === filter;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; color: "mint" | "lemon" | "pink" | "gray" }> = {
      paid: { label: "支払済", color: "mint" },
      pending: { label: "保留中", color: "lemon" },
      refunded: { label: "返金済", color: "pink" },
      cancelled: { label: "キャンセル", color: "gray" },
    };
    const s = map[status] || { label: status, color: "gray" as const };
    return <Badge color={s.color} size="sm">{s.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-ink">
          支援者一覧<span className="ml-1.5 text-sm font-normal text-ink-muted tabular-nums">{filtered.length}名</span>
        </h3>
        <div className="flex gap-2 flex-wrap justify-end">
          {!showNameCredits && backers.some((b) => b.status === "paid") && (
            <Button
              size="sm"
              variant="outline"
              icon={<Flower2 size={14} />}
              onClick={() => setShowNameCredits(true)}
            >
              フラスタ用お名前コピー
            </Button>
          )}
          {canRecordOffline && !showOfflineForm && (
            <Button
              size="sm"
              variant="outline"
              icon={<Banknote size={14} />}
              onClick={() => setShowOfflineForm(true)}
            >
              現地支援を記録
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-line">
        {(["all", "paid", "refunded"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-2 -mb-px text-sm border-b-2 transition-colors",
              filter === f
                ? "border-ink text-ink font-bold"
                : "border-transparent text-ink-muted hover:text-ink"
            )}
          >
            {f === "all" ? "すべて" : f === "paid" ? "支払済" : "返金済"}
          </button>
        ))}
      </div>

      {showNameCredits && (
        <NameCreditPanel backers={backers} onClose={() => setShowNameCredits(false)} />
      )}

      {showOfflineForm && (
        <OfflineBackingForm
          project={project}
          onSaved={onChanged}
          onClose={() => setShowOfflineForm(false)}
        />
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-white py-14 text-center text-sm text-ink-muted">
          {filter === "all"
            ? "まだ支援者はいません"
            : "該当する支援者はいません"}
        </div>
      ) : (
        <ul className="rounded-xl border border-line bg-white divide-y divide-line">
          {filtered.map((backer) => (
            <li key={backer.id} className="px-4 sm:px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-ink-muted font-bold text-sm flex-shrink-0">
                  {backer.is_anonymous ? (
                    <UserRound size={16} />
                  ) : (
                    (backer.guest_nickname || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="font-bold text-ink text-sm">
                        {backer.is_anonymous
                          ? "匿名サポーター"
                          : backer.guest_nickname || "サポーター"}
                      </span>
                      {statusBadge(backer.status)}
                      {backer.payment_method === "cash" && (
                        <Badge color="lemon" size="sm">現地・現金</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-base font-bold text-ink tabular-nums">
                        {formatCurrency(backer.amount)}
                      </span>
                      {backer.payment_method === "cash" &&
                        backer.status === "paid" && (
                          <button
                            type="button"
                            onClick={() => cancelOffline(backer)}
                            disabled={cancellingId === backer.id}
                            className="p-1.5 rounded-md text-ink-muted hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                            title="この現地支援を取り消す"
                            aria-label="この現地支援を取り消す"
                          >
                            {cancellingId === backer.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Undo2 size={14} />
                            )}
                          </button>
                        )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted">
                    <span className="flex items-center gap-1 min-w-0 break-all">
                      <Mail size={12} className="flex-shrink-0" />
                      {backer.guest_email || "メール未登録"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {timeAgo(backer.created_at)}
                    </span>
                    {backer.rewards && (
                      <span className="flex items-center gap-1">
                        <Gift size={12} />
                        {(backer.rewards as unknown as Reward).title}
                      </span>
                    )}
                    {backer.guest_address && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        住所あり
                      </span>
                    )}
                  </div>

                  {backer.message && (
                    <p className="text-sm text-ink-soft mt-2 px-3 py-2 rounded-lg bg-cream-100">
                      &ldquo;{backer.message}&rdquo;
                    </p>
                  )}
                  {backer.payment_method === "cash" && backer.fulfillment_note && (
                    <p className="text-xs text-ink-muted mt-2">
                      メモ: {backer.fulfillment_note}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ================ Rewards Tab ================ */
function RewardsTab({
  project,
  onChanged,
}: {
  project: Project;
  onChanged: () => void;
}) {
  const rewards = project.rewards || [];
  const [showForm, setShowForm] = useState(false);
  const [newReward, setNewReward] = useState({
    title: "",
    description: "",
    titleEn: "",
    descriptionEn: "",
    amount: 1000,
    rewardType: "physical",
    needsAddress: true,
    quantityTotal: undefined as number | undefined,
  });
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newReward.title || !newReward.amount) return;
    setAdding(true);
    try {
      const res = await fetch(
        `/api/dashboard/projects/${project.id}/rewards`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newReward),
        }
      );
      if (!res.ok) throw new Error();
      setShowForm(false);
      setNewReward({
        title: "",
        description: "",
        titleEn: "",
        descriptionEn: "",
        amount: 1000,
        rewardType: "physical",
        needsAddress: true,
        quantityTotal: undefined,
      });
      onChanged();
    } catch {
      alert("リターンの追加に失敗しました");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm("このリターンを削除しますか？")) return;
    try {
      await fetch(`/api/dashboard/projects/${project.id}/rewards`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });
      onChanged();
    } catch {
      alert("削除に失敗しました");
    }
  };

  const rewardTypeIcon = (type: string) => {
    switch (type) {
      case "digital": return <Smartphone size={16} />;
      case "experience": return <Star size={16} />;
      default: return <Package size={16} />;
    }
  };

  const rewardTypeLabel = (type: string) => {
    switch (type) {
      case "digital": return "デジタル";
      case "experience": return "体験";
      case "no_reward": return "リターンなし";
      default: return "物品";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-ink">
          リターン管理<span className="ml-1.5 text-sm font-normal text-ink-muted tabular-nums">{rewards.length}種類</span>
        </h3>
        <Button
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setShowForm(!showForm)}
        >
          リターンを追加
        </Button>
      </div>

      {showForm && (
        <div>
          <Card className="rounded-xl">
            <h4 className="font-bold text-ink mb-4">新しいリターン</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "physical", label: "物品", icon: <Package size={16} /> },
                  { value: "digital", label: "デジタル", icon: <Smartphone size={16} /> },
                  { value: "experience", label: "体験", icon: <Star size={16} /> },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setNewReward((p) => ({
                        ...p,
                        rewardType: t.value,
                        needsAddress: t.value === "physical",
                      }));
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 h-10 rounded-lg text-xs font-bold border transition-colors",
                      newReward.rewardType === t.value
                        ? "border-ink bg-ink text-white"
                        : "border-line-strong bg-white text-ink-soft hover:bg-cream-50"
                    )}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              <Input
                label="タイトル"
                placeholder="例：限定お礼ボイス＋デジタルアルバム"
                value={newReward.title}
                onChange={(e) =>
                  setNewReward((p) => ({ ...p, title: e.target.value }))
                }
                fullWidth
              />
              <Textarea
                label="説明"
                placeholder="リターンの詳細"
                value={newReward.description}
                onChange={(e) =>
                  setNewReward((p) => ({ ...p, description: e.target.value }))
                }
                rows={3}
                fullWidth
              />

              <EnglishPanel
                hasContent={Boolean(
                  newReward.titleEn || newReward.descriptionEn
                )}
              >
                <Input
                  label="Title"
                  value={newReward.titleEn}
                  onChange={(e) =>
                    setNewReward((p) => ({ ...p, titleEn: e.target.value }))
                  }
                  fullWidth
                />
                <Textarea
                  label="Description"
                  value={newReward.descriptionEn}
                  onChange={(e) =>
                    setNewReward((p) => ({
                      ...p,
                      descriptionEn: e.target.value,
                    }))
                  }
                  rows={3}
                  fullWidth
                />
              </EnglishPanel>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="金額（円）"
                  type="number"
                  value={newReward.amount.toString()}
                  onChange={(e) =>
                    setNewReward((p) => ({
                      ...p,
                      amount: parseInt(e.target.value) || 0,
                    }))
                  }
                  fullWidth
                />
                <Input
                  label="数量制限（任意）"
                  type="number"
                  placeholder="無制限"
                  value={newReward.quantityTotal?.toString() || ""}
                  onChange={(e) =>
                    setNewReward((p) => ({
                      ...p,
                      quantityTotal: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    }))
                  }
                  fullWidth
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAdd}
                  loading={adding}
                  icon={<Plus size={14} />}
                >
                  追加する
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  キャンセル
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="rounded-xl border border-line bg-white py-14 text-center">
          <p className="text-sm text-ink-muted">まだリターンはありません</p>
          <p className="text-xs text-ink-faint mt-1">
            物品のほか、デジタルコンテンツや体験も設定できます
          </p>
        </div>
      ) : (
        <ul className="rounded-xl border border-line bg-white divide-y divide-line">
          {rewards.map((reward) => (
            <li key={reward.id} className="px-4 sm:px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 text-ink-muted flex-shrink-0">
                    {rewardTypeIcon(reward.reward_type)}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-ink text-sm">
                      {reward.title}
                    </h4>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {rewardTypeLabel(reward.reward_type)} ·{" "}
                      {reward.needs_address ? "住所必要" : "住所不要"}
                    </p>
                    {reward.description && (
                      <p className="text-sm text-ink-soft mt-2 line-clamp-2">
                        {reward.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-ink tabular-nums">
                    {formatCurrency(reward.amount)}
                  </p>
                  <p className="text-xs text-ink-muted tabular-nums">
                    {reward.quantity_claimed || 0}
                    {reward.quantity_total
                      ? ` / ${reward.quantity_total}`
                      : ""}{" "}
                    支援
                  </p>
                  <button
                    onClick={() => handleDelete(reward.id)}
                    aria-label="このリターンを削除"
                    className="mt-2 p-1.5 rounded-md text-ink-faint hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ================ Updates Tab ================ */
function UpdatesTab({
  projectId,
  updates,
  onPosted,
}: {
  projectId: string;
  updates: ProjectUpdate[];
  onPosted: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    isBackersOnly: false,
  });
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!form.title || !form.content) return;
    setPosting(true);
    try {
      const res = await fetch(
        `/api/dashboard/projects/${projectId}/updates`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) throw new Error();
      setShowForm(false);
      setForm({ title: "", content: "", isBackersOnly: false });
      onPosted();
    } catch {
      alert("投稿に失敗しました");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-ink">
          活動報告<span className="ml-1.5 text-sm font-normal text-ink-muted tabular-nums">{updates.length}件</span>
        </h3>
        <Button
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setShowForm(!showForm)}
        >
          活動報告を書く
        </Button>
      </div>

      {showForm && (
        <div>
          <Card className="rounded-xl">
            <h4 className="font-bold text-ink mb-4">新しい活動報告</h4>
            <div className="space-y-4">
              <Input
                label="タイトル"
                placeholder="進捗報告やお知らせのタイトル"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                fullWidth
              />
              <MarkdownEditor
                label="内容"
                placeholder="プロジェクトの進捗や支援者へのメッセージ"
                value={form.content}
                onChange={(v) => setForm((p) => ({ ...p, content: v }))}
                rows={8}
                allowImages
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isBackersOnly}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isBackersOnly: e.target.checked }))
                  }
                  className="rounded"
                />
                <span className="text-sm font-medium text-ink-soft flex items-center gap-1">
                  {form.isBackersOnly ? <EyeOff size={14} /> : <Eye size={14} />}
                  支援者のみに公開
                </span>
              </label>
              <div className="flex gap-3">
                <Button
                  onClick={handlePost}
                  loading={posting}
                  icon={<Send size={14} />}
                >
                  投稿する
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  キャンセル
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {updates.length === 0 ? (
        <div className="rounded-xl border border-line bg-white py-14 text-center text-sm text-ink-muted">
          まだ活動報告はありません。投稿すると支援者に近況を伝えられます。
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <Card key={update.id} className="rounded-xl">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-bold text-ink">{update.title}</h4>
                {update.is_backers_only && (
                  <Badge color="pink" size="sm" className="flex-shrink-0">
                    <EyeOff size={10} />
                    支援者限定
                  </Badge>
                )}
              </div>
              <Markdown className="text-sm text-ink-soft">
                {update.content}
              </Markdown>
              <p className="text-xs text-ink-faint mt-3">
                {timeAgo(update.created_at)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================ Helpers ================ */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm font-bold text-ink tabular-nums">{value}</dd>
    </div>
  );
}
