"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  ChevronDown,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import {
  formatDeadline,
  formatJstDate,
  formatJstTime,
  isoToJstInput,
  jstDateKey,
} from "@/lib/schedule/time";
import { cn } from "@/lib/utils";
import type { Reward, RewardScheduleWithRoster, ScheduleRosterEntry } from "@/types";

/**
 * 体験リターン（お出かけ・通話など）の日程調整。
 * 日程調整を作って候補の枠を並べ、対象の支援者へ案内メールを送る。
 * 支援者はメールのリンクから枠を選び、予約状況はここに集まる。
 */

type InviteMode = "test" | "uninvited" | "unanswered";

const fieldLabel = "text-sm font-bold text-ink";
const selectClass =
  "w-full h-11 rounded-xl border border-line-strong bg-white px-3.5 text-ink outline-none focus:border-caramel-400 focus:ring-4 focus:ring-caramel-200/50";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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

export default function ScheduleTab({
  projectId,
  rewards,
}: {
  projectId: string;
  rewards: Reward[];
}) {
  const [schedules, setSchedules] = useState<RewardScheduleWithRoster[]>([]);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [testEmail, setTestEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const base = `/api/dashboard/projects/${projectId}/schedules`;

  const load = useCallback(async () => {
    const { ok, data } = await api<{
      schedules: RewardScheduleWithRoster[];
      emailConfigured: boolean;
      testEmail: string | null;
    }>(base);
    if (ok) {
      setSchedules(data.schedules || []);
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
            お出かけ・通話・撮影会など、日時を決めて実施するリターンの日程を支援者と調整します。候補の日時を並べて案内メールを送ると、支援者が専用リンクから都合のよい枠を選べます。
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
          onCancel={() => setCreating(false)}
          onSubmit={async (values) => {
            const { ok, data } = await api(base, { method: "POST", body: JSON.stringify(values) });
            if (!ok) {
              toast.error(data.error || "作成できませんでした");
              return;
            }
            toast.success("日程調整を作りました。続けて候補の日時を追加してください");
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
          base={`${base}/${s.id}`}
          emailConfigured={emailConfigured}
          testEmail={testEmail}
          onChanged={load}
        />
      ))}
    </div>
  );
}

/* ================ 日程調整の作成・編集フォーム ================ */

type ScheduleValues = {
  rewardId: string;
  title: string;
  description: string;
  location: string;
  durationMinutes: string;
  deadline: string;
};

function ScheduleForm({
  rewards,
  initial,
  onSubmit,
  onCancel,
}: {
  rewards: Reward[];
  initial?: Partial<ScheduleValues>;
  onSubmit: (values: Omit<ScheduleValues, "durationMinutes"> & { durationMinutes: number | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const editing = Boolean(initial);
  const [values, setValues] = useState<ScheduleValues>({
    rewardId: initial?.rewardId ?? rewards[0]?.id ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    location: initial?.location ?? "",
    durationMinutes: initial?.durationMinutes ?? "60",
    deadline: initial?.deadline ?? "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof ScheduleValues) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const reward = rewards.find((r) => r.id === values.rewardId);

  return (
    <Card className="rounded-xl">
      <h3 className="font-bold text-ink mb-4">{editing ? "日程調整を編集" : "新しい日程調整"}</h3>
      <div className="space-y-4">
        {!editing && (
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel}>対象のリターン</label>
            <select
              className={selectClass}
              value={values.rewardId}
              onChange={(e) => {
                const r = rewards.find((x) => x.id === e.target.value);
                setValues((v) => ({ ...v, rewardId: e.target.value, title: v.title || r?.title || "" }));
              }}
            >
              {rewards.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}（¥{r.amount.toLocaleString()}）{r.reward_type === "experience" ? " ・体験" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-muted">
              このリターンを含むプランの支援者（上位プランも含む）が対象になります
            </p>
          </div>
        )}
        <Input
          label="タイトル"
          value={values.title}
          onChange={set("title")}
          placeholder={reward ? `${reward.title}（例: オンライン通話会）` : "例: オンライン通話会"}
          maxLength={100}
          fullWidth
        />
        <Textarea
          label="案内文"
          value={values.description}
          onChange={set("description")}
          rows={4}
          maxLength={3000}
          placeholder="内容・当日の流れ・持ち物・注意事項など。案内メールと日程選択画面に表示されます"
          fullWidth
        />
        <Textarea
          label="場所・参加方法"
          value={values.location}
          onChange={set("location")}
          rows={2}
          maxLength={1000}
          hint="集合場所や通話URLなど。日程を選んだ支援者にだけ表示し、確認メールにも記載します"
          fullWidth
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="所要時間（分）"
            type="number"
            min={5}
            max={1440}
            value={values.durationMinutes}
            onChange={set("durationMinutes")}
            hint="空欄なら開始時刻だけ表示します"
            fullWidth
          />
          <Input
            label="回答期限（任意）"
            type="datetime-local"
            value={values.deadline}
            onChange={set("deadline")}
            hint="日本時間。期限を過ぎると支援者は選択・変更できません"
            fullWidth
          />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          キャンセル
        </Button>
        <Button
          loading={saving}
          disabled={!values.title.trim() || !values.rewardId}
          onClick={async () => {
            setSaving(true);
            try {
              await onSubmit({
                ...values,
                durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : null,
              });
            } finally {
              setSaving(false);
            }
          }}
        >
          {editing ? "保存する" : "作成する"}
        </Button>
      </div>
    </Card>
  );
}

/* ================ 日程調整1件 ================ */

function ScheduleCard({
  schedule,
  reward,
  rewards,
  base,
  emailConfigured,
  testEmail,
  onChanged,
}: {
  schedule: RewardScheduleWithRoster;
  reward?: Reward;
  rewards: Reward[];
  base: string;
  emailConfigured: boolean;
  testEmail: string | null;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState<InviteMode | null>(null);
  const [showRoster, setShowRoster] = useState(false);

  const eligible = schedule.roster.filter((r) => r.eligible);
  const invited = eligible.filter((r) => r.invitedAt);
  const booked = schedule.roster.filter((r) => r.slotId);
  const uninvited = eligible.filter((r) => !r.invitedAt);
  const unanswered = invited.filter((r) => !r.slotId);
  const deadlinePassed =
    !!schedule.deadline && new Date(schedule.deadline).getTime() < Date.now();
  const futureSlots = schedule.slots.filter((s) => new Date(s.starts_at).getTime() > Date.now());
  const canInvite =
    emailConfigured && schedule.status === "open" && !deadlinePassed && futureSlots.length > 0;

  const bookedBySlot = useMemo(() => {
    const map = new Map<string, ScheduleRosterEntry[]>();
    for (const r of schedule.roster) {
      if (r.slotId) map.set(r.slotId, [...(map.get(r.slotId) ?? []), r]);
    }
    return map;
  }, [schedule.roster]);

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
    const msg =
      booked.length > 0
        ? `「${schedule.title}」を削除します。${booked.length}人の予約も消え、支援者のリンクは使えなくなります（支援者へのお知らせは送られません）。よろしいですか？`
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
      const ok = window.confirm(
        mode === "uninvited"
          ? `まだ案内していない${count}人に案内メールを送ります。よろしいですか？`
          : `日程を選んでいない${count}人に案内メールを再送します。前に送ったリンクは使えなくなります。よろしいですか？`
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

  if (editing) {
    return (
      <ScheduleForm
        rewards={rewards}
        initial={{
          rewardId: schedule.reward_id,
          title: schedule.title,
          description: schedule.description,
          location: schedule.location,
          durationMinutes: schedule.duration_minutes ? String(schedule.duration_minutes) : "",
          deadline: schedule.deadline ? isoToJstInput(schedule.deadline) : "",
        }}
        onCancel={() => setEditing(false)}
        onSubmit={async ({ title, description, location, durationMinutes, deadline }) => {
          const ok = await patch(
            { title, description, location, durationMinutes, deadline },
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
          </div>
          <div className="flex gap-1 flex-shrink-0">
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
        <SlotAdder base={base} durationMinutes={schedule.duration_minutes} onAdded={onChanged} />
      </div>

      {/* 案内と回答状況 */}
      <div className="p-5 sm:p-6">
        <dl className="grid grid-cols-2 sm:grid-cols-4 rounded-lg border border-line divide-x divide-y sm:divide-y-0 divide-line mb-3">
          {[
            { label: "対象（1人1件）", value: eligible.length },
            { label: "未案内", value: uninvited.length },
            { label: "未回答", value: unanswered.length },
            { label: "予約済み", value: booked.length },
          ].map((s) => (
            <div key={s.label} className="px-3 py-2.5 min-w-0">
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
        {emailConfigured && futureSlots.length === 0 && (
          <p className="text-xs text-ink-muted mb-3">案内を送るには、先に今後の日時の枠を追加してください</p>
        )}
        {emailConfigured && (schedule.status !== "open" || deadlinePassed) && (
          <p className="text-xs text-ink-muted mb-3">
            受付終了・回答期限切れのあいだは案内を送れません
          </p>
        )}

        {schedule.roster.length > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowRoster((v) => !v)}
              className="flex items-center gap-1 text-xs font-bold text-ink-muted hover:text-ink"
            >
              <ChevronDown size={14} className={cn("transition-transform", showRoster && "rotate-180")} />
              <Users size={13} />
              対象者を{showRoster ? "閉じる" : "見る"}
            </button>
            {showRoster && (
              <Roster roster={schedule.roster} schedule={schedule} />
            )}
          </div>
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
        `${label} の枠には${data.bookedCount}人の予約があります。削除すると、その人たちは「未回答」に戻ります（自動のお知らせは送られないので、個別にご連絡ください）。削除しますか？`
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
    return <p className="text-sm text-ink-muted mb-4">まだ枠がありません。下のフォームから追加してください。</p>;
  }

  return (
    <div className="space-y-4 mb-5">
      {days.map((slots) => (
        <div key={slots[0].starts_at}>
          <p className="text-xs font-bold text-ink-muted mb-1.5">{formatJstDate(slots[0].starts_at)}</p>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {slots.map((slot) => {
              const people = bookedBySlot.get(slot.id) ?? [];
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
                      {people.length}/{slot.capacity}人{people.length >= slot.capacity && " ・満席"}
                    </button>
                    {slot.note && <span className="text-xs text-ink-muted"> ・ {slot.note}</span>}
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

/* ================ 枠の追加 ================ */

function SlotAdder({
  base,
  durationMinutes,
  onAdded,
}: {
  base: string;
  durationMinutes: number | null;
  onAdded: () => Promise<void>;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("14:00");
  const [count, setCount] = useState("1");
  const [interval, setIntervalMinutes] = useState(String(durationMinutes ?? 30));
  const [capacity, setCapacity] = useState("1");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // 「14:00から30分おきに6枠」のように連続した枠をまとめて作る
  const preview = useMemo(() => {
    if (!date || !/^\d{2}:\d{2}$/.test(time)) return [];
    const n = Math.min(Math.max(Number(count) || 1, 1), 48);
    const step = Math.max(Number(interval) || 0, 5);
    const start = new Date(`${date}T${time}:00+09:00`).getTime();
    if (!Number.isFinite(start)) return [];
    return Array.from({ length: n }, (_, i) =>
      isoToJstInput(new Date(start + i * step * 60_000).toISOString())
    );
  }, [date, time, count, interval]);

  const add = async () => {
    setSaving(true);
    try {
      const { ok, data } = await api(`${base}/slots`, {
        method: "POST",
        body: JSON.stringify({
          slots: preview.map((startsAt) => ({ startsAt, capacity: Number(capacity), note })),
        }),
      });
      if (!ok) throw new Error(data.error || "追加できませんでした");
      toast.success(`${preview.length}枠を追加しました`);
      setNote("");
      await onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加できませんでした");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg bg-cream-50 border border-line p-4">
      <p className="text-xs font-bold text-ink mb-3">枠を追加（日本時間）</p>
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="col-span-2">
          <Input label="日付" type="date" value={date} onChange={(e) => setDate(e.target.value)} fullWidth />
        </div>
        <Input label="開始" type="time" value={time} onChange={(e) => setTime(e.target.value)} fullWidth />
        <Input label="枠数" type="number" min={1} max={48} value={count} onChange={(e) => setCount(e.target.value)} fullWidth />
        <Input
          label="間隔（分）"
          type="number"
          min={5}
          value={interval}
          onChange={(e) => setIntervalMinutes(e.target.value)}
          disabled={Number(count) <= 1}
          fullWidth
        />
        <Input label="定員" type="number" min={1} max={1000} value={capacity} onChange={(e) => setCapacity(e.target.value)} fullWidth />
        <div className="col-span-2 sm:col-span-6">
          <Input
            label="補足（任意）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="例: 新宿駅集合 / 2部"
            fullWidth
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-muted tabular-nums">
          {preview.length > 1
            ? `${preview[0].slice(11)}〜${preview[preview.length - 1].slice(11)} の${preview.length}枠`
            : preview.length === 1
              ? `${preview[0].replace("T", " ")} の1枠`
              : "日付を選んでください"}
        </p>
        <Button size="sm" icon={<Plus size={14} />} loading={saving} disabled={preview.length === 0} onClick={add}>
          追加する
        </Button>
      </div>
    </div>
  );
}

/* ================ 対象者一覧 ================ */

function Roster({
  roster,
  schedule,
}: {
  roster: ScheduleRosterEntry[];
  schedule: RewardScheduleWithRoster;
}) {
  const slotLabel = (slotId: string) => {
    const s = schedule.slots.find((x) => x.id === slotId);
    return s ? `${formatJstDate(s.starts_at)} ${formatJstTime(s.starts_at)}` : "";
  };
  return (
    <ul className="mt-2 max-h-80 overflow-y-auto divide-y divide-line rounded-lg border border-line">
      {roster.map((r) => (
        <li key={r.email} className="flex items-start gap-3 px-4 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink truncate">{r.name || "（お名前未入力）"}</p>
            <p className="text-xs text-ink-muted truncate">{r.email}</p>
            {r.backerCount > 1 && (
              <p className="text-xs text-ink-muted">{r.backerCount}件の支援を1件にまとめています</p>
            )}
            {r.message && (
              <p className="text-xs text-ink-soft mt-1 whitespace-pre-wrap break-words">「{r.message}」</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            {!r.eligible && (
              <Badge color="pink" size="sm">対象外（返金等）</Badge>
            )}
            {r.slotId ? (
              <Badge color="mint" size="sm">{slotLabel(r.slotId)}</Badge>
            ) : r.invitedAt ? (
              <Badge color="lemon" size="sm">未回答</Badge>
            ) : (
              <Badge color="gray" size="sm">未案内</Badge>
            )}
            {r.invitedAt && (
              <p className="text-[11px] text-ink-muted mt-0.5">案内 {formatDateTime(r.invitedAt)}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
