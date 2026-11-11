"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CalendarPlus,
  Eye,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ScheduleForm from "@/components/dashboard/schedule/ScheduleForm";
import SchedulePreviewModal, {
  buildPreviewView,
} from "@/components/dashboard/schedule/SchedulePreviewModal";
import SlotBuilder from "@/components/dashboard/schedule/SlotBuilder";
import {
  formatDeadline,
  formatJstDate,
  formatJstTime,
  isoToJstInput,
  jstDateKey,
} from "@/lib/schedule/time";
import { cn } from "@/lib/utils";
import type {
  Reward,
  RewardScheduleWithRoster,
  ScheduleRosterEntry,
  ScheduleTargetPreview,
} from "@/types";

/**
 * 体験リターン（お出かけ・通話など）の日程調整。
 * 日程調整を作って候補の枠を並べ、対象の支援者へ案内メールを送る。
 * 支援者は第3希望まで（と「その他」・質問への回答）を送り、掲載者がそれをもとに日程を確定して知らせる。
 */

type InviteMode = "test" | "uninvited" | "unanswered";

const rankLabel = (i: number) => `第${i + 1}希望`;

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const shortSlot = (iso: string) => `${formatJstDate(iso).replace(/^\d+年/, "")} ${formatJstTime(iso)}`;

async function api<T = Record<string, unknown>>(
  url: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/** 対象者の状態（一覧の絞り込みとバッジに使う） */
type RosterStatus = "excluded" | "ineligible" | "confirmed" | "waiting" | "unanswered" | "uninvited";

function statusOf(r: ScheduleRosterEntry): RosterStatus {
  if (r.excluded) return "excluded";
  if (!r.eligible) return "ineligible";
  if (r.tickets > 0 && r.slotIds.length >= r.tickets) return "confirmed";
  if (r.submittedAt) return "waiting";
  if (r.invitedAt) return "unanswered";
  return "uninvited";
}

export default function ScheduleTab({
  projectId,
  projectTitle,
  rewards,
}: {
  projectId: string;
  projectTitle: string;
  rewards: Reward[];
}) {
  const [schedules, setSchedules] = useState<RewardScheduleWithRoster[]>([]);
  const [targets, setTargets] = useState<Record<string, ScheduleTargetPreview[]>>({});
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [testEmail, setTestEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const base = `/api/dashboard/projects/${projectId}/schedules`;

  const load = useCallback(async () => {
    const { ok, data } = await api<{
      schedules: RewardScheduleWithRoster[];
      targets: Record<string, ScheduleTargetPreview[]>;
      emailConfigured: boolean;
      testEmail: string | null;
    }>(base);
    if (ok) {
      setSchedules(data.schedules || []);
      setTargets(data.targets || {});
      setEmailConfigured(data.emailConfigured !== false);
      setTestEmail(data.testEmail ?? null);
    } else {
      toast.error(data.error || "日程調整を読み込めませんでした");
    }
    setLoading(false);
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  // 体験リターンを先に。リターンなしは対象外
  const candidates = useMemo(
    () =>
      rewards
        .filter((r) => r.reward_type !== "no_reward")
        .sort(
          (a, b) =>
            Number(b.reward_type === "experience") - Number(a.reward_type === "experience") ||
            a.amount - b.amount
        ),
    [rewards]
  );

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 size={24} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-bold text-ink">日程調整</h2>
          <p className="text-sm text-ink-muted mt-0.5 max-w-2xl">
            お出かけ・通話・撮影会など、日時を決めて実施するリターンの日程を支援者と調整します。候補の日時を並べて案内メールを送ると、支援者が第3希望まで（候補に合わなければ「その他」に自由記入）回答できます。回答をもとに日程を確定し、お知らせメールを送ります。
          </p>
        </div>
        {!creating && candidates.length > 0 && (
          <Button icon={<Plus size={16} />} onClick={() => setCreating(true)} className="flex-shrink-0">
            日程調整を作る
          </Button>
        )}
      </div>

      {candidates.length === 0 && (
        <Card className="rounded-xl text-sm text-ink-muted">
          日程調整できるリターンがありません。「リターン」タブで体験リターンを追加してください。
        </Card>
      )}

      {creating && (
        <ScheduleForm
          rewards={candidates}
          targets={targets}
          projectTitle={projectTitle}
          onCancel={() => setCreating(false)}
          onSubmit={async (values, slots) => {
            const { ok, data } = await api(base, {
              method: "POST",
              body: JSON.stringify({ ...values, slots }),
            });
            if (!ok) {
              toast.error(data.error || "作成できませんでした");
              return;
            }
            toast.success(
              slots.length > 0
                ? `日程調整を作りました（候補${slots.length}枠）。テスト送信で見え方を確かめてから、案内を送ってください`
                : "日程調整を作りました。必要なら候補の日時を追加して、案内を送ってください"
            );
            setCreating(false);
            await load();
          }}
        />
      )}

      {schedules.length === 0 && !creating && candidates.length > 0 && (
        <Card className="rounded-xl text-center py-12">
          <CalendarPlus size={28} className="mx-auto text-ink-faint" />
          <p className="mt-3 text-sm text-ink-muted">まだ日程調整はありません</p>
        </Card>
      )}

      {schedules.map((s) => (
        <ScheduleCard
          key={s.id}
          schedule={s}
          reward={rewards.find((r) => r.id === s.reward_id)}
          rewards={candidates}
          targets={targets}
          base={`${base}/${s.id}`}
          projectTitle={projectTitle}
          emailConfigured={emailConfigured}
          testEmail={testEmail}
          onChanged={load}
        />
      ))}
    </div>
  );
}

/* ================ 日程調整1件 ================ */

function ScheduleCard({
  schedule,
  reward,
  rewards,
  targets,
  base,
  projectTitle,
  emailConfigured,
  testEmail,
  onChanged,
}: {
  schedule: RewardScheduleWithRoster;
  reward?: Reward;
  rewards: Reward[];
  targets: Record<string, ScheduleTargetPreview[]>;
  base: string;
  projectTitle: string;
  emailConfigured: boolean;
  testEmail: string | null;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState<InviteMode | "notice" | null>(null);
  const [assigning, setAssigning] = useState(false);

  const eligible = schedule.roster.filter((r) => r.eligible);
  const counts = useMemo(() => {
    const c: Record<RosterStatus, number> = {
      excluded: 0,
      ineligible: 0,
      confirmed: 0,
      waiting: 0,
      unanswered: 0,
      uninvited: 0,
    };
    for (const r of schedule.roster) c[statusOf(r)]++;
    return c;
  }, [schedule.roster]);
  const uninvited = eligible.filter((r) => !r.invitedAt);
  const unanswered = eligible.filter((r) => statusOf(r) === "unanswered");
  const assignable = eligible.filter(
    (r) => statusOf(r) === "waiting" && r.preferredSlotIds.length > 0
  );
  const needsNotice = schedule.roster.filter((r) => r.participantId && r.invitedAt && r.needsNotice);
  const deadlinePassed =
    !!schedule.deadline && new Date(schedule.deadline).getTime() < Date.now();
  const futureSlots = schedule.slots.filter((s) => new Date(s.starts_at).getTime() > Date.now());
  const hasAskable = futureSlots.length > 0 || schedule.allow_other || schedule.questions.length > 0;
  const canInvite = emailConfigured && schedule.status === "open" && !deadlinePassed && hasAskable;

  const bookedBySlot = useMemo(() => {
    const map = new Map<string, ScheduleRosterEntry[]>();
    for (const r of schedule.roster) {
      for (const id of r.slotIds) map.set(id, [...(map.get(id) ?? []), r]);
    }
    return map;
  }, [schedule.roster]);

  const previewSlots = schedule.slots.map((s) => ({
    id: s.id,
    startsAt: s.starts_at,
    note: s.note,
    remaining: Math.max(0, s.capacity - (bookedBySlot.get(s.id)?.length ?? 0)),
    isPast: new Date(s.starts_at).getTime() < Date.now(),
  }));

  const patch = async (body: Record<string, unknown>, success: string) => {
    const { ok, data } = await api(base, { method: "PATCH", body: JSON.stringify(body) });
    if (!ok) {
      toast.error(data.error || "保存できませんでした");
      return false;
    }
    toast.success(success);
    await onChanged();
    return true;
  };

  const remove = async () => {
    const answered = schedule.roster.filter((r) => r.submittedAt || r.slotIds.length > 0);
    const msg =
      answered.length > 0
        ? `「${schedule.title}」を削除します。${answered.length}人の回答・確定も消え、支援者のリンクは使えなくなります（支援者へのお知らせは送られません）。よろしいですか？`
        : `「${schedule.title}」を削除します。よろしいですか？`;
    if (!window.confirm(msg)) return;
    const { ok, data } = await api(base, { method: "DELETE" });
    if (!ok) {
      toast.error(data.error || "削除できませんでした");
      return;
    }
    toast.success("日程調整を削除しました");
    await onChanged();
  };

  const invite = async (mode: InviteMode) => {
    const count = mode === "uninvited" ? uninvited.length : unanswered.length;
    if (mode !== "test") {
      const noSlots =
        futureSlots.length === 0
          ? "候補の日時がまだありません。支援者は自由記入だけで回答することになります。"
          : "";
      const ok = window.confirm(
        noSlots +
          (mode === "uninvited"
            ? `まだ案内していない${count}人に案内メールを送ります。よろしいですか？`
            : `まだ回答していない${count}人に案内メールを再送します。前に送ったリンクは使えなくなります。よろしいですか？`)
      );
      if (!ok) return;
    }
    setSending(mode);
    try {
      const { ok, data } = await api<{ sent: number; failed: number; recordFailed: boolean; testSentTo?: string }>(
        `${base}/invitations`,
        { method: "POST", body: JSON.stringify({ mode, requestId: crypto.randomUUID() }) }
      );
      if (!ok) throw new Error(data.error || "送信に失敗しました");
      if (mode === "test") {
        toast.success(`${data.testSentTo} にテストメールを送りました`);
        return;
      }
      if (data.failed > 0) {
        toast.error(`${data.sent}人に送信し、${data.failed}人には送れませんでした。時間をおいて再度お試しください`);
      } else {
        toast.success(`${data.sent}人に案内メールを送りました`);
      }
      if (data.recordFailed) {
        toast.error("送信はできましたが、送付記録の保存に失敗しました。運営にお問い合わせください");
      }
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSending(null);
    }
  };

  const autoAssign = async () => {
    const ok = window.confirm(
      `確定待ちの${assignable.length}人を、回答の早い順に第1希望→第2希望→第3希望の空いている枠で確定します（支援者へのお知らせはまだ送られません）。よろしいですか？`
    );
    if (!ok) return;
    setAssigning(true);
    try {
      const { ok: done, data } = await api<{ assigned: number; remaining: number; failed: number }>(
        `${base}/assign`,
        { method: "POST" }
      );
      if (!done) throw new Error(data.error || "割り当てられませんでした");
      toast.success(
        data.remaining > 0
          ? `${data.assigned}人の日程を確定しました。${data.remaining}人は希望の枠が空いていないため、個別に確定してください`
          : `${data.assigned}人の日程を確定しました。内容を確認して、お知らせを送ってください`
      );
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "割り当てられませんでした");
    } finally {
      setAssigning(false);
    }
  };

  const sendNotices = async () => {
    const cancelCount = needsNotice.filter((r) => r.slotIds.length === 0).length;
    const reanswerable =
      schedule.status === "open" &&
      (!schedule.deadline || new Date(schedule.deadline).getTime() > Date.now());
    const ok = window.confirm(
      `日程の確定（変更・取り消しを含む）を${needsNotice.length}人にメールでお知らせします。メールのリンクは新しくなり、前のリンクは使えなくなります。${
        cancelCount > 0 && reanswerable
          ? `日程を取り消した${cancelCount}人には、希望の日程を選び直してもらう案内になり、前の希望は消えて「未回答」に戻ります。`
          : ""
      }よろしいですか？`
    );
    if (!ok) return;
    setSending("notice");
    try {
      const { ok: done, data } = await api<{ sent: number; failed: number; recordFailed: boolean }>(
        `${base}/notices`,
        { method: "POST", body: JSON.stringify({ requestId: crypto.randomUUID() }) }
      );
      if (!done) throw new Error(data.error || "送信に失敗しました");
      if (data.failed > 0) {
        toast.error(`${data.sent}人に送信し、${data.failed}人には送れませんでした。時間をおいて再度お試しください`);
      } else {
        toast.success(`${data.sent}人に確定のお知らせを送りました`);
      }
      if (data.recordFailed) {
        toast.error("送信はできましたが、送付記録の保存に失敗しました。運営にお問い合わせください");
      }
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSending(null);
    }
  };

  if (editing) {
    return (
      <ScheduleForm
        rewards={rewards}
        targets={targets}
        projectTitle={projectTitle}
        existingSlots={previewSlots}
        initial={{
          rewardId: schedule.reward_id,
          title: schedule.title,
          description: schedule.description,
          location: schedule.location,
          durationMinutes: schedule.duration_minutes ? String(schedule.duration_minutes) : "",
          deadline: schedule.deadline ? isoToJstInput(schedule.deadline) : "",
          allowOther: schedule.allow_other,
          questions: schedule.questions,
        }}
        onCancel={() => setEditing(false)}
        onSubmit={async ({ title, description, location, durationMinutes, deadline, allowOther, questions }) => {
          const ok = await patch(
            { title, description, location, durationMinutes, deadline, allowOther, questions },
            "日程調整を保存しました"
          );
          if (ok) setEditing(false);
        }}
      />
    );
  }

  return (
    <Card className="rounded-xl" padding="none">
      {/* 見出し */}
      <div className="p-5 sm:p-6 border-b border-line">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-ink-muted truncate">{reward?.title ?? "（削除されたリターン）"}</p>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <h3 className="font-bold text-ink text-lg break-words">{schedule.title}</h3>
              {schedule.status === "closed" ? (
                <Badge color="gray" size="sm">受付終了</Badge>
              ) : deadlinePassed ? (
                <Badge color="gray" size="sm">期限切れ</Badge>
              ) : (
                <Badge color="mint" size="sm">受付中</Badge>
              )}
            </div>
            <p className="text-xs text-ink-muted mt-1">
              {schedule.duration_minutes ? `所要 約${schedule.duration_minutes}分` : "所要時間 未設定"}
              {schedule.deadline && ` ・ 回答期限 ${formatDeadline(schedule.deadline)}`}
            </p>
            <p className="text-xs text-ink-muted mt-0.5">
              回答: 第3希望まで
              {schedule.allow_other && " ・ その他（自由記入）"}
              {schedule.questions.length > 0 &&
                ` ・ 質問「${schedule.questions.map((q) => q.label).join("」「")}」`}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="sm" variant="ghost" icon={<Eye size={14} />} onClick={() => setPreviewing(true)}>
              回答画面
            </Button>
            <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={() => setEditing(true)}>
              編集
            </Button>
            <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={remove} aria-label="削除" />
          </div>
        </div>
        <div className="mt-3">
          <button
            type="button"
            className="text-xs font-bold text-ink-muted underline underline-offset-4 hover:text-ink"
            onClick={() =>
              patch(
                { status: schedule.status === "open" ? "closed" : "open" },
                schedule.status === "open" ? "受付を終了しました" : "受付を再開しました"
              )
            }
          >
            {schedule.status === "open" ? "受付を終了する" : "受付を再開する"}
          </button>
        </div>
      </div>

      {/* 枠 */}
      <div className="p-5 sm:p-6 border-b border-line">
        <h4 className="text-sm font-bold text-ink mb-3">候補の日時（{schedule.slots.length}枠）</h4>
        <SlotList
          schedule={schedule}
          bookedBySlot={bookedBySlot}
          base={base}
          onChanged={onChanged}
        />
        <SlotBuilder
          durationMinutes={schedule.duration_minutes}
          existing={schedule.slots.map((s) => isoToJstInput(s.starts_at))}
          title="枠を追加（日本時間）"
          addLabel="枠を追加する"
          onAdd={async (slots) => {
            const { ok, data } = await api(`${base}/slots`, {
              method: "POST",
              body: JSON.stringify({ slots }),
            });
            if (!ok) {
              toast.error(data.error || "追加できませんでした");
              return false;
            }
            toast.success(`${slots.length}枠を追加しました`);
            await onChanged();
            return true;
          }}
        />
      </div>

      {/* 案内 */}
      <div className="p-5 sm:p-6 border-b border-line">
        <dl className="grid grid-cols-3 sm:grid-cols-5 rounded-lg border border-line divide-x divide-line mb-3">
          {[
            { label: "対象", value: eligible.length },
            { label: "未案内", value: counts.uninvited },
            { label: "未回答", value: counts.unanswered },
            { label: "確定待ち", value: counts.waiting },
            { label: "確定済み", value: counts.confirmed },
          ].map((s, i) => (
            <div
              key={s.label}
              className={cn("px-3 py-2.5 min-w-0", i >= 3 && "border-t border-line sm:border-t-0")}
            >
              <dt className="text-[11px] sm:text-xs font-bold text-ink-muted truncate">{s.label}</dt>
              <dd className="text-xl font-bold text-ink tabular-nums">
                {s.value}
                <span className="text-xs font-semibold text-ink-muted ml-1">人</span>
              </dd>
            </div>
          ))}
        </dl>

        {schedule.missingEmailCount > 0 && (
          <p className="text-xs text-amber-700 mb-3">
            メールアドレスが無い支援（現地支援など）が{schedule.missingEmailCount}件あります。この方々とは別の方法で日程を調整してください
          </p>
        )}
        {!emailConfigured && (
          <p className="text-xs text-red-600 mb-3">
            メール送信の設定が完了していないため、現在は案内を送れません
          </p>
        )}
        {emailConfigured && !hasAskable && (
          <p className="text-xs text-ink-muted mb-3">
            案内を送るには、今後の日時の枠を追加するか、「その他」や質問を設定してください
          </p>
        )}
        {emailConfigured && (schedule.status !== "open" || deadlinePassed) && (
          <p className="text-xs text-ink-muted mb-3">
            受付終了・回答期限切れのあいだは案内を送れません
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            icon={<Mail size={16} />}
            loading={sending === "test"}
            disabled={!canInvite || sending !== null}
            onClick={() => invite("test")}
            title={testEmail ? `${testEmail} に送ります` : undefined}
          >
            自分にテスト送信
          </Button>
          {unanswered.length > 0 && (
            <Button
              variant="outline"
              icon={<Send size={16} />}
              loading={sending === "unanswered"}
              disabled={!canInvite || sending !== null}
              onClick={() => invite("unanswered")}
            >
              未回答の{unanswered.length}人に再送
            </Button>
          )}
          <Button
            icon={<Send size={16} />}
            loading={sending === "uninvited"}
            disabled={!canInvite || uninvited.length === 0 || sending !== null}
            onClick={() => invite("uninvited")}
          >
            未案内の{uninvited.length}人に案内を送る
          </Button>
        </div>
      </div>

      {/* 対象者と回答・確定 */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h4 className="flex items-center gap-1.5 text-sm font-bold text-ink">
            <Users size={15} />
            対象者と回答（{schedule.roster.length - counts.excluded}人）
          </h4>
          <div className="flex flex-wrap gap-2">
            {assignable.length > 0 && futureSlots.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                icon={<Sparkles size={14} />}
                loading={assigning}
                disabled={assigning || sending !== null}
                onClick={autoAssign}
              >
                希望をもとに自動で確定（{assignable.length}人）
              </Button>
            )}
            {needsNotice.length > 0 && (
              <Button
                size="sm"
                icon={<BellRing size={14} />}
                loading={sending === "notice"}
                disabled={!emailConfigured || sending !== null || assigning}
                onClick={sendNotices}
              >
                確定のお知らせを送る（{needsNotice.length}人）
              </Button>
            )}
          </div>
        </div>
        {needsNotice.length > 0 && (
          <p className="text-xs text-caramel-700 mb-3">
            日程を確定・変更した{needsNotice.length}人に、まだお知らせを送っていません。確定の内容は、お知らせを送るまで支援者にメールで届きません
          </p>
        )}
        {schedule.roster.length === 0 ? (
          <p className="text-sm text-ink-muted">まだ対象の支援者はいません</p>
        ) : (
          <Roster schedule={schedule} bookedBySlot={bookedBySlot} base={base} onChanged={onChanged} />
        )}
      </div>

      {previewing && (
        <SchedulePreviewModal
          view={buildPreviewView({
            projectTitle,
            rewardTitle: reward?.title ?? "",
            title: schedule.title,
            description: schedule.description,
            durationMinutes: schedule.duration_minutes,
            deadline: schedule.deadline,
            allowOther: schedule.allow_other,
            questions: schedule.questions,
            slots: previewSlots,
          })}
          onClose={() => setPreviewing(false)}
        />
      )}
    </Card>
  );
}

/* ================ 枠の一覧 ================ */

function SlotList({
  schedule,
  bookedBySlot,
  base,
  onChanged,
}: {
  schedule: RewardScheduleWithRoster;
  bookedBySlot: Map<string, ScheduleRosterEntry[]>;
  base: string;
  onChanged: () => Promise<void>;
}) {
  const days = useMemo(() => {
    const map = new Map<string, typeof schedule.slots>();
    for (const s of schedule.slots) {
      const key = jstDateKey(s.starts_at);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.values()];
  }, [schedule]);

  // 枠ごとに、まだ確定していない人の希望が何人ずつ入っているか（第1〜第3希望）
  const wishesBySlot = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const r of schedule.roster) {
      if (!r.eligible || statusOf(r) === "confirmed") continue;
      r.preferredSlotIds.forEach((id, rank) => {
        if (r.slotIds.includes(id)) return;
        const counts = map.get(id) ?? [0, 0, 0];
        counts[rank] = (counts[rank] ?? 0) + 1;
        map.set(id, counts);
      });
    }
    return map;
  }, [schedule.roster]);

  const changeCapacity = async (slotId: string, current: number) => {
    const input = window.prompt("定員（人）", String(current));
    if (input === null) return;
    const capacity = Number(input);
    const { ok, data } = await api(`${base}/slots/${slotId}`, {
      method: "PATCH",
      body: JSON.stringify({ capacity }),
    });
    if (!ok) {
      toast.error(data.error || "変更できませんでした");
      return;
    }
    await onChanged();
  };

  const removeSlot = async (slotId: string, label: string) => {
    let { ok, status, data } = await api<{ bookedCount?: number }>(`${base}/slots/${slotId}`, {
      method: "DELETE",
    });
    if (status === 409) {
      const confirmed = window.confirm(
        `${label} の枠で${data.bookedCount}人の日程を確定しています。削除すると、その人たちは「確定待ち」に戻ります。お知らせを送ると、確定の取り消しが伝わります。削除しますか？`
      );
      if (!confirmed) return;
      ({ ok, data } = await api(`${base}/slots/${slotId}?force=1`, { method: "DELETE" }));
    }
    if (!ok) {
      toast.error(data.error || "削除できませんでした");
      return;
    }
    await onChanged();
  };

  if (days.length === 0) {
    return (
      <p className="text-sm text-ink-muted mb-4">
        まだ枠がありません。下のフォームから追加してください。
        {schedule.allow_other && "枠を作らずに案内すると、支援者は「その他」に希望の日時を書いて回答します。"}
      </p>
    );
  }

  return (
    <div className="space-y-4 mb-5">
      {days.map((slots) => (
        <div key={slots[0].starts_at}>
          <p className="text-xs font-bold text-ink-muted mb-1.5">{formatJstDate(slots[0].starts_at)}</p>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {slots.map((slot) => {
              const people = bookedBySlot.get(slot.id) ?? [];
              const wishes = wishesBySlot.get(slot.id);
              const past = new Date(slot.starts_at).getTime() < Date.now();
              const label = `${formatJstDate(slot.starts_at)} ${formatJstTime(slot.starts_at)}`;
              return (
                <li key={slot.id} className={cn("flex items-start gap-3 px-3 sm:px-4 py-2.5", past && "bg-cream-50")}>
                  <div className="w-14 flex-shrink-0 font-bold text-ink tabular-nums">
                    {formatJstTime(slot.starts_at)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => changeCapacity(slot.id, slot.capacity)}
                      className={cn(
                        "text-xs font-bold tabular-nums underline-offset-4 hover:underline",
                        people.length >= slot.capacity ? "text-caramel-700" : "text-ink-muted"
                      )}
                      title="定員を変更"
                    >
                      確定 {people.length}/{slot.capacity}人{people.length >= slot.capacity && " ・満席"}
                    </button>
                    {slot.note && <span className="text-xs text-ink-muted"> ・ {slot.note}</span>}
                    {wishes && (
                      <span className="text-xs text-ink-muted">
                        {" ・ 希望 "}
                        {wishes
                          .map((n, i) => (n > 0 ? `${rankLabel(i).replace("希望", "")}${n}人` : null))
                          .filter(Boolean)
                          .join("・")}
                      </span>
                    )}
                    {people.length > 0 && (
                      <p className="text-sm text-ink mt-0.5 break-words">
                        {people.map((p) => p.name || p.email).join("、")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.id, label)}
                    className="p-1 text-ink-faint hover:text-red-600"
                    aria-label={`${label} の枠を削除`}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ================ 対象者と回答・確定 ================ */

const FILTERS: { id: "all" | RosterStatus; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "waiting", label: "確定待ち" },
  { id: "unanswered", label: "未回答" },
  { id: "uninvited", label: "未案内" },
  { id: "confirmed", label: "確定済み" },
];

function Roster({
  schedule,
  bookedBySlot,
  base,
  onChanged,
}: {
  schedule: RewardScheduleWithRoster;
  bookedBySlot: Map<string, ScheduleRosterEntry[]>;
  base: string;
  onChanged: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<"all" | RosterStatus>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const active = schedule.roster.filter((r) => !r.excluded);
  const excluded = schedule.roster.filter((r) => r.excluded);
  const shown = active.filter((r) => filter === "all" || statusOf(r) === filter);
  const slotOf = new Map(schedule.slots.map((s) => [s.id, s]));
  const remainingOf = (slotId: string) =>
    (slotOf.get(slotId)?.capacity ?? 0) - (bookedBySlot.get(slotId)?.length ?? 0);

  const save = async (r: ScheduleRosterEntry, slotIds: string[]) => {
    if (!r.participantId) return;
    setBusy(r.participantId);
    try {
      const { ok, data } = await api(`${base}/participants/${r.participantId}`, {
        method: "PATCH",
        body: JSON.stringify({ slotIds }),
      });
      if (!ok) throw new Error(data.error || "確定できませんでした");
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "確定できませんでした");
    } finally {
      setBusy(null);
    }
  };

  /** 1口の人は差し替え、複数口の人は口数まで足す */
  const confirm = (r: ScheduleRosterEntry, slotId: string) => {
    if (r.tickets <= 1) return save(r, [slotId]);
    if (r.slotIds.length >= r.tickets) {
      toast.error(`この方は${r.tickets}枠まで確定できます。どれかを外してから確定してください`);
      return;
    }
    return save(r, [...r.slotIds, slotId]);
  };

  const setExcluded = async (r: ScheduleRosterEntry, exclude: boolean) => {
    const label = r.name || r.email;
    if (exclude) {
      const notes = [
        r.invitedAt && "送った案内のリンクからは回答できなくなります。",
        r.submittedAt && "回答の内容は残り、対象に戻すとまた表示されます。",
      ]
        .filter(Boolean)
        .join("");
      if (!window.confirm(`${label} さんを対象から外します。今後、案内メールは送られません。${notes}よろしいですか？`)) {
        return;
      }
    }
    const current = schedule.excluded_emails ?? [];
    setBusy(r.email);
    try {
      const { ok, data } = await api(base, {
        method: "PATCH",
        body: JSON.stringify({
          excludedEmails: exclude ? [...current, r.email] : current.filter((e) => e !== r.email),
        }),
      });
      if (!ok) throw new Error(data.error || "変更できませんでした");
      toast.success(exclude ? `${label} さんを対象から外しました` : `${label} さんを対象に戻しました`);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "変更できませんでした");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {FILTERS.map((f) => {
          const n =
            f.id === "all" ? active.length : active.filter((r) => statusOf(r) === f.id).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-bold transition-colors",
                filter === f.id
                  ? "border-ink bg-ink text-white"
                  : "border-line-strong bg-white text-ink-muted hover:text-ink"
              )}
            >
              {f.label} {n}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-ink-muted">該当する人はいません</p>
      ) : (
        <ul className="max-h-[36rem] overflow-y-auto divide-y divide-line rounded-lg border border-line">
          {shown.map((r) => {
            const status = statusOf(r);
            const canConfirm = Boolean(r.participantId) && r.tickets > 0;
            const answeredQuestions = schedule.questions.filter((q) => r.answers[q.id]);
            return (
              <li key={r.email} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{r.name || "（お名前未入力）"}</p>
                    <p className="text-xs text-ink-muted truncate">{r.email}</p>
                    {(r.tickets > 1 || r.backerCount > 1) && (
                      <p className="text-xs text-ink-muted">
                        {r.tickets > 1 && `${r.tickets}口（${r.tickets}回分を確定）`}
                        {r.tickets > 1 && r.backerCount > 1 && " ・ "}
                        {r.backerCount > 1 && `${r.backerCount}件の支援をまとめています`}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 space-y-0.5">
                    <StatusBadge r={r} status={status} />
                    {r.needsNotice && r.invitedAt && (
                      <div>
                        <Badge color="caramel" size="sm">お知らせ未送信</Badge>
                      </div>
                    )}
                    {r.submittedAt ? (
                      <p className="text-[11px] text-ink-muted">回答 {formatDateTime(r.submittedAt)}</p>
                    ) : (
                      r.invitedAt && (
                        <p className="text-[11px] text-ink-muted">案内 {formatDateTime(r.invitedAt)}</p>
                      )
                    )}
                  </div>
                  {r.eligible && r.slotIds.length === 0 && (
                    <button
                      type="button"
                      className="-mr-1 p-1 text-ink-faint hover:text-red-600 disabled:opacity-40 flex-shrink-0"
                      aria-label={`${r.name || r.email}を対象から外す`}
                      title="対象から外す（実施済みなど）"
                      disabled={busy !== null}
                      onClick={() => setExcluded(r, true)}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {r.slotIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.slotIds.map((id) => {
                      const s = slotOf.get(id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 tabular-nums"
                        >
                          確定 {s ? shortSlot(s.starts_at) : ""}
                          <button
                            type="button"
                            className="text-emerald-700 hover:text-red-600 disabled:opacity-40"
                            aria-label="確定を外す"
                            disabled={busy !== null}
                            onClick={() => save(r, r.slotIds.filter((x) => x !== id))}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {(r.preferredSlotIds.length > 0 || r.otherText || answeredQuestions.length > 0 || r.message) && (
                  <dl className="mt-2 rounded-lg bg-cream-50 px-3 py-2 space-y-1.5 text-sm">
                    {r.preferredSlotIds.map((id, i) => {
                      const s = slotOf.get(id);
                      if (!s) return null;
                      const done = r.slotIds.includes(id);
                      const full = !done && remainingOf(id) <= 0;
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <dt className="w-16 flex-shrink-0 text-xs font-bold text-caramel-700">
                            {rankLabel(i)}
                          </dt>
                          <dd className="flex-1 min-w-0 text-ink tabular-nums">
                            {shortSlot(s.starts_at)}
                            {full && <span className="ml-1 text-xs text-ink-muted">（満席）</span>}
                          </dd>
                          {canConfirm && !done && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy !== null || full}
                              onClick={() => confirm(r, id)}
                            >
                              {r.tickets <= 1 && r.slotIds.length > 0 ? "これに変更" : "確定"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    {r.otherText && (
                      <div>
                        <dt className="text-xs font-bold text-ink-muted">その他のご希望</dt>
                        <dd className="text-ink whitespace-pre-wrap break-words">{r.otherText}</dd>
                      </div>
                    )}
                    {answeredQuestions.map((q) => (
                      <div key={q.id}>
                        <dt className="text-xs font-bold text-ink-muted">{q.label}</dt>
                        <dd className="text-ink whitespace-pre-wrap break-words">{r.answers[q.id]}</dd>
                      </div>
                    ))}
                    {r.message && (
                      <div>
                        <dt className="text-xs font-bold text-ink-muted">メッセージ</dt>
                        <dd className="text-ink whitespace-pre-wrap break-words">「{r.message}」</dd>
                      </div>
                    )}
                  </dl>
                )}

                {canConfirm && schedule.slots.length > 0 && (
                  <div className="mt-2">
                    <select
                      className="h-9 rounded-lg border border-line-strong bg-white px-2.5 text-xs text-ink outline-none focus:border-caramel-400"
                      value=""
                      disabled={busy !== null}
                      onChange={(e) => e.target.value && confirm(r, e.target.value)}
                      aria-label="ほかの枠で確定"
                    >
                      <option value="">ほかの枠で確定…</option>
                      {schedule.slots
                        .filter((s) => !r.slotIds.includes(s.id))
                        .map((s) => (
                          <option key={s.id} value={s.id} disabled={remainingOf(s.id) <= 0}>
                            {shortSlot(s.starts_at)}
                            {remainingOf(s.id) <= 0 ? "（満席）" : `（残り${remainingOf(s.id)}）`}
                            {s.note && ` ${s.note}`}
                          </option>
                        ))}
                    </select>
                    {r.otherText && (
                      <p className="mt-1 text-[11px] text-ink-muted">
                        「その他」の日時で確定するときは、上の「枠を追加」でその日時の枠を作ってから選んでください
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {excluded.length > 0 && (
        <details className="mt-3 rounded-lg border border-line px-4 py-2.5">
          <summary className="cursor-pointer text-xs font-bold text-ink-muted">
            対象から外した人（{excluded.length}人）
          </summary>
          <p className="mt-1.5 text-xs text-ink-muted">
            案内メールは送られず、案内済みのリンクからも回答できません。戻すと、また対象になります
          </p>
          <ul className="mt-1 divide-y divide-line">
            {excluded.map((r) => (
              <li key={r.email} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink-muted">{r.name || "（お名前未入力）"}</span>
                  <span className="block truncate text-xs text-ink-muted">{r.email}</span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy !== null}
                  onClick={() => setExcluded(r, false)}
                >
                  対象に戻す
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function StatusBadge({ r, status }: { r: ScheduleRosterEntry; status: RosterStatus }) {
  switch (status) {
    case "excluded":
      return <Badge color="gray" size="sm">対象から外した人</Badge>;
    case "ineligible":
      return <Badge color="pink" size="sm">対象外（返金等）</Badge>;
    case "confirmed":
      return <Badge color="mint" size="sm">確定済み</Badge>;
    case "waiting":
      return (
        <Badge color="lemon" size="sm">
          {r.slotIds.length > 0 ? `あと${r.tickets - r.slotIds.length}枠 確定待ち` : "確定待ち"}
        </Badge>
      );
    case "unanswered":
      return <Badge color="gray" size="sm">未回答</Badge>;
    default:
      return <Badge color="new" size="sm">未案内</Badge>;
  }
}
