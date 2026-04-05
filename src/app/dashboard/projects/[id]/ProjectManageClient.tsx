"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Edit3,
  Users,
  Gift,
  Megaphone,
  DollarSign,
  Clock,
  TrendingUp,
  Save,
  Plus,
  Trash2,
  Send,
  Eye,
  EyeOff,
  Loader2,
  ChevronRight,
  Calendar,
  Mail,
  MapPin,
  Package,
  Smartphone,
  Star,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Input";
import ProgressBar from "@/components/ui/ProgressBar";
import AnimatedSection from "@/components/animations/AnimatedSection";
import {
  formatCurrency,
  formatNumber,
  getStatusLabel,
  timeAgo,
  cn,
} from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Project, Reward, Backer, ProjectUpdate } from "@/types";

type Tab = "overview" | "edit" | "backers" | "rewards" | "updates";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-candy-pink mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!project || !stats) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "概要", icon: <BarChart3 size={16} /> },
    { id: "edit", label: "編集", icon: <Edit3 size={16} /> },
    { id: "backers", label: "支援者", icon: <Users size={16} /> },
    { id: "rewards", label: "リターン", icon: <Gift size={16} /> },
    { id: "updates", label: "活動報告", icon: <Megaphone size={16} /> },
  ];

  const { label: statusLabel } = getStatusLabel(project.status);

  return (
    <div className="min-h-screen pt-20" style={{ background: "#FFFBF5" }}>
      {/* Header */}
      <div
        className="py-6"
        style={{ background: "linear-gradient(135deg, #2D1B4E 0%, #1a0f2e 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-semibold mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            ダッシュボードに戻る
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-white truncate">
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
              <div className="flex items-center gap-4 text-sm text-white/40">
                <span className="flex items-center gap-1">
                  <DollarSign size={14} />
                  {formatCurrency(stats.totalRaised)}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {stats.totalBackers}人
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  残り{stats.daysLeft}日
                </span>
              </div>
            </div>
            <Link href={`/projects/${project.slug || project.id}`}>
              <Button variant="outline" size="sm" icon={<Eye size={14} />}>
                プレビュー
              </Button>
            </Link>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <ProgressBar percentage={stats.progressPercentage} color="candy" />
            <p className="text-xs text-white/40 mt-1">
              {stats.progressPercentage}% 達成
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-caramel-100 bg-white sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-candy-pink text-candy-pink"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        {activeTab === "backers" && <BackersTab backers={backers} />}
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "支援金額", value: formatCurrency(stats.totalRaised), icon: <DollarSign size={18} />, color: "#FF6B9D" },
            { label: "支援者数", value: `${stats.totalBackers}人`, icon: <Users size={18} />, color: "#FFB347" },
            { label: "達成率", value: `${stats.progressPercentage}%`, icon: <TrendingUp size={18} />, color: "#4ECDC4" },
            { label: "平均支援額", value: formatCurrency(stats.avgBacking), icon: <BarChart3 size={18} />, color: "#C3B1E1" },
          ].map((item, i) => (
            <AnimatedSection key={i} animation="scale" delay={i * 60}>
              <Card>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white mb-2"
                  style={{ background: item.color }}
                >
                  {item.icon}
                </div>
                <p className="text-xl font-bold text-gray-800">{item.value}</p>
                <p className="text-xs text-gray-400">{item.label}</p>
              </Card>
            </AnimatedSection>
          ))}
        </div>

        {/* Project Info */}
        <Card>
          <h3 className="font-bold text-gray-800 mb-4">プロジェクト情報</h3>
          <dl className="space-y-3">
            <InfoRow label="目標金額" value={formatCurrency(project.goal_amount)} />
            <InfoRow label="掲載終了日" value={project.end_date ? new Date(project.end_date).toLocaleDateString("ja-JP") : "未設定"} />
            <InfoRow label="リターン数" value={`${project.rewards?.length || 0}種類`} />
            <InfoRow label="作成日" value={new Date(project.created_at).toLocaleDateString("ja-JP")} />
          </dl>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card>
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={16} className="text-candy-pink" />
            最新の応援
          </h3>
          {paidBackers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              まだ応援はありません
            </p>
          ) : (
            <div className="space-y-3">
              {paidBackers.map((backer) => (
                <div key={backer.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-caramel-100 flex items-center justify-center text-sm flex-shrink-0">
                    {backer.is_anonymous ? "🎭" : (backer.guest_nickname || "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700 truncate">
                        {backer.is_anonymous ? "匿名" : backer.guest_nickname || "サポーター"}
                      </span>
                      <span className="text-sm font-bold text-caramel-600">
                        {formatCurrency(backer.amount)}
                      </span>
                    </div>
                    {backer.message && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {backer.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-300 mt-0.5">
                      {timeAgo(backer.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Megaphone size={16} className="text-caramel-500" />
            最新の活動報告
          </h3>
          {updates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              まだ活動報告はありません
            </p>
          ) : (
            <div className="space-y-2">
              {updates.slice(0, 3).map((u) => (
                <div key={u.id} className="p-3 rounded-xl bg-caramel-50">
                  <p className="text-sm font-semibold text-gray-700 line-clamp-1">
                    {u.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {timeAgo(u.created_at)}
                    {u.is_backers_only && (
                      <span className="ml-2 text-candy-pink">支援者限定</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
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
    description: project.description,
    story: project.story || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      onSaved();
      alert("保存しました");
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <AnimatedSection animation="fade-up">
        <Card>
          <h3 className="text-lg font-bold text-gray-800 mb-6">
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

            <Textarea
              label="プロジェクト概要"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={10}
              fullWidth
            />

            <Textarea
              label="ストーリー"
              value={form.story}
              onChange={(e) => setForm((p) => ({ ...p, story: e.target.value }))}
              rows={8}
              fullWidth
            />

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
      </AnimatedSection>
    </div>
  );
}

/* ================ Backers Tab ================ */
function BackersTab({ backers }: { backers: Backer[] }) {
  const [filter, setFilter] = useState<"all" | "paid" | "refunded">("all");

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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">
          支援者一覧（{filtered.length}名）
        </h3>
        <div className="flex gap-2">
          {(["all", "paid", "refunded"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                filter === f
                  ? "text-white"
                  : "bg-caramel-50 text-gray-500 hover:bg-caramel-100"
              )}
              style={
                filter === f
                  ? { background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }
                  : {}
              }
            >
              {f === "all" ? "すべて" : f === "paid" ? "支払済" : "返金済"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">
              {filter === "all"
                ? "まだ支援者はいません"
                : "該当する支援者はいません"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((backer, i) => (
            <AnimatedSection key={backer.id} animation="fade-up" delay={i * 40}>
              <Card>
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #C3B1E1, #74C0FC)" }}
                  >
                    {backer.is_anonymous
                      ? "🎭"
                      : (backer.guest_nickname || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-sm">
                          {backer.is_anonymous
                            ? "匿名サポーター"
                            : backer.guest_nickname || "サポーター"}
                        </span>
                        {statusBadge(backer.status)}
                      </div>
                      <span className="text-lg font-bold text-caramel-600">
                        {formatCurrency(backer.amount)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Mail size={12} />
                        {backer.guest_email}
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
                      <p className="text-sm text-gray-500 mt-2 p-2 rounded-xl bg-caramel-50">
                        &ldquo;{backer.message}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </AnimatedSection>
          ))}
        </div>
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">
          リターン管理（{rewards.length}種類）
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
        <AnimatedSection animation="fade-up">
          <Card variant="outlined">
            <h4 className="font-bold text-gray-800 mb-4">新しいリターン</h4>
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
                      "flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border-2 transition-all",
                      newReward.rewardType === t.value
                        ? "text-white border-transparent"
                        : "border-caramel-100 text-gray-500"
                    )}
                    style={
                      newReward.rewardType === t.value
                        ? { background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }
                        : {}
                    }
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
        </AnimatedSection>
      )}

      {rewards.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Gift size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">
              リターンを設定しましょう
            </p>
            <p className="text-xs text-gray-300 mt-1">
              デジタルコンテンツも設定できます
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {rewards.map((reward, i) => (
            <AnimatedSection key={reward.id} animation="fade-up" delay={i * 50}>
              <Card>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #FFB347, #FF6B9D)" }}
                    >
                      {rewardTypeIcon(reward.reward_type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">
                        {reward.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {rewardTypeLabel(reward.reward_type)} ·{" "}
                        {reward.needs_address ? "住所必要" : "住所不要"}
                      </p>
                      {reward.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {reward.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-caramel-600">
                      {formatCurrency(reward.amount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {reward.quantity_claimed || 0}
                      {reward.quantity_total
                        ? ` / ${reward.quantity_total}`
                        : ""}{" "}
                      支援
                    </p>
                    <button
                      onClick={() => handleDelete(reward.id)}
                      className="mt-2 p-1.5 rounded-full text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            </AnimatedSection>
          ))}
        </div>
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">
          活動報告（{updates.length}件）
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
        <AnimatedSection animation="fade-up">
          <Card variant="outlined">
            <h4 className="font-bold text-gray-800 mb-4">新しい活動報告</h4>
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
              <Textarea
                label="内容"
                placeholder="プロジェクトの進捗や支援者へのメッセージを書きましょう"
                value={form.content}
                onChange={(e) =>
                  setForm((p) => ({ ...p, content: e.target.value }))
                }
                rows={8}
                fullWidth
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
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
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
        </AnimatedSection>
      )}

      {updates.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Megaphone size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">
              活動報告を投稿して支援者に近況を伝えましょう
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {updates.map((update, i) => (
            <AnimatedSection key={update.id} animation="fade-up" delay={i * 50}>
              <Card>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-gray-800">{update.title}</h4>
                  {update.is_backers_only && (
                    <Badge color="pink" size="sm">
                      <EyeOff size={10} />
                      支援者限定
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {update.content}
                </p>
                <p className="text-xs text-gray-300 mt-3">
                  {timeAgo(update.created_at)}
                </p>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================ Helpers ================ */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-caramel-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-bold text-gray-800">{value}</span>
    </div>
  );
}
