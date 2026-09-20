"use client";

import { useState } from "react";
import { Check, Flag, Lock, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import AnimatedSection from "@/components/animations/AnimatedSection";
import {
  nextUnreached,
  resolveFinalGoal,
  splitMilestones,
} from "@/lib/project/goals";
import { cn, formatCurrency } from "@/lib/utils";
import type { Project, ProjectMilestone } from "@/types";

interface GoalsTabProps {
  project: Project;
  onChanged: () => void;
}

const LIVE_STATUSES = new Set(["active", "funded", "completed"]);

/**
 * ゴール管理。
 *
 * 基本の段階ゴール（最終目標の分母）は掲載開始後に動かせないので
 * 読み取り専用で並べる。掲載中に足せるのは、その上に置く「努力目標」だけ。
 * 努力目標は達成率・達成バッジに影響しないため、達成済みのプロジェクトを
 * 未達成に戻すことなく、残りの期間で目指す先を追加できる。
 */
export default function GoalsTab({ project, onChanged }: GoalsTabProps) {
  const { base, stretch } = splitMilestones(project.project_milestones);
  const finalGoal = resolveFinalGoal(project.goal_amount, base);
  const current = project.current_amount;
  const isLive = LIVE_STATUSES.has(project.status);
  const finalReached = current >= finalGoal;
  const nextStretch = nextUnreached(stretch, current);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    title: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const amountNum = Number(form.amount);
  const amountIssue =
    form.amount === ""
      ? null
      : !Number.isInteger(amountNum) || amountNum <= 0
      ? "1円以上の整数で入力してください"
      : amountNum <= finalGoal
      ? `最終目標（${formatCurrency(finalGoal)}）より大きい金額にしてください`
      : stretch.some((m) => m.amount === amountNum)
      ? "同じ金額の努力目標がすでにあります"
      : null;
  const canSubmit =
    form.amount !== "" && !amountIssue && form.title.trim().length > 0;

  const handleAdd = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/dashboard/projects/${project.id}/stretch-goals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountNum,
            title: form.title.trim(),
            description: form.description.trim(),
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "追加に失敗しました");
      setForm({ amount: "", title: "", description: "" });
      setShowForm(false);
      onChanged();
      toast.success("努力目標を追加しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: ProjectMilestone) => {
    if (!confirm(`努力目標「${m.title}」を削除しますか？`)) return;
    setDeletingId(m.id);
    try {
      const res = await fetch(
        `/api/dashboard/projects/${project.id}/stretch-goals`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ milestoneId: m.id }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "削除に失敗しました");
      onChanged();
      toast.success("努力目標を削除しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* 基本の段階ゴール（読み取り専用） */}
      <AnimatedSection animation="fade-up">
        <Card>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Flag size={18} className="text-caramel-500" />
              {base.length > 0 ? "段階ゴール" : "目標金額"}
            </h3>
            <span className="text-xs font-bold text-caramel-500">
              最終目標 {formatCurrency(finalGoal)}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            {isLive
              ? "掲載開始後は変更できません。支援者が見て応援を決めた条件のためです"
              : "掲載前はプロジェクト作成画面から編集できます"}
          </p>

          {base.length > 0 ? (
            <ol className="space-y-2">
              {base.map((m) => (
                <GoalRow key={m.id} milestone={m} current={current} />
              ))}
            </ol>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-caramel-50">
              <span className="text-sm text-gray-600">目標金額</span>
              <span className="font-bold text-gray-800">
                {formatCurrency(project.goal_amount)}
              </span>
            </div>
          )}
        </Card>
      </AnimatedSection>

      {/* 努力目標 */}
      <AnimatedSection animation="fade-up" delay={60}>
        <Card>
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Sparkles size={18} className="text-candy-pink" />
              努力目標
            </h3>
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowForm((v) => !v)}
            >
              努力目標を追加
            </Button>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            最終目標のさらに先に置く、プラスアルファのゴールです。達成率や達成バッジには影響せず、
            最終目標を達成したあとに「あと ¥◯◯ で△△」としてプロジェクトページに表示されます。
          </p>

          {!finalReached && stretch.length > 0 && (
            <div className="mb-4 p-3 rounded-2xl bg-caramel-50 text-xs text-caramel-700 font-semibold">
              最終目標にまだ届いていないため、努力目標の案内はプロジェクトページの
              支援状況には出ません（ゴール一覧には表示されます）
            </div>
          )}

          {showForm && (
            <div className="mb-4 p-4 rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/40 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-3">
                <Input
                  label="金額（円）"
                  type="number"
                  inputMode="numeric"
                  placeholder={String(finalGoal + 100000)}
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  error={amountIssue ?? undefined}
                  fullWidth
                />
                <Input
                  label="達成内容"
                  placeholder="例：新曲のMV制作"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  maxLength={60}
                  fullWidth
                />
              </div>
              <Textarea
                label="補足説明（任意）"
                placeholder="達成したら何をするかを一言で"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
                maxLength={200}
                fullWidth
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleAdd}
                  loading={saving}
                  disabled={!canSubmit}
                  icon={<Plus size={14} />}
                >
                  追加する
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  キャンセル
                </Button>
              </div>
            </div>
          )}

          {stretch.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Sparkles size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">努力目標はまだありません</p>
              <p className="text-xs mt-1">
                最終目標を達成したら、残りの期間で目指す次のゴールを置けます
              </p>
            </div>
          ) : (
            <ol className="space-y-2">
              {stretch.map((m) => (
                <GoalRow
                  key={m.id}
                  milestone={m}
                  current={current}
                  stretch
                  isNext={nextStretch?.id === m.id}
                  onDelete={() => handleDelete(m)}
                  deleting={deletingId === m.id}
                />
              ))}
            </ol>
          )}
        </Card>
      </AnimatedSection>
    </div>
  );
}

function GoalRow({
  milestone: m,
  current,
  stretch = false,
  isNext = false,
  onDelete,
  deleting = false,
}: {
  milestone: ProjectMilestone;
  current: number;
  stretch?: boolean;
  isNext?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const achieved = current >= m.amount;
  return (
    <li
      className={cn(
        "flex items-start gap-3 p-3 rounded-2xl border-2",
        achieved
          ? "border-transparent bg-green-50"
          : isNext
          ? "border-pink-200 bg-pink-50"
          : "border-caramel-100 bg-white"
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
          achieved
            ? "text-white"
            : stretch
            ? "text-candy-pink bg-pink-100"
            : "text-gray-400 bg-caramel-100"
        )}
        style={
          achieved
            ? { background: "linear-gradient(135deg, #34a853, #8FD4C4)" }
            : {}
        }
      >
        {achieved ? (
          <Check size={15} />
        ) : stretch ? (
          <Sparkles size={13} />
        ) : (
          <Lock size={13} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "font-bold text-sm truncate",
              achieved ? "text-green-700" : "text-gray-800"
            )}
          >
            {m.title}
          </span>
          <span
            className={cn(
              "text-sm font-bold flex-shrink-0",
              achieved
                ? "text-green-600"
                : stretch
                ? "text-candy-pink"
                : "text-caramel-600"
            )}
          >
            {formatCurrency(m.amount)}
          </span>
        </div>
        {m.description && (
          <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
        )}
        <p
          className={cn(
            "text-xs font-semibold mt-1",
            achieved ? "text-green-600" : "text-gray-400"
          )}
        >
          {achieved
            ? "達成しました"
            : `あと ${formatCurrency(m.amount - current)}`}
        </p>
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label="この努力目標を削除"
          className="p-1.5 rounded-full text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      )}
    </li>
  );
}
