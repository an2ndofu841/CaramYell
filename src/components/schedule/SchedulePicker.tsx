"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Clock, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import {
  formatDeadline,
  formatJstDate,
  formatJstTime,
  formatSlotTime,
  jstDateKey,
} from "@/lib/schedule/time";
import { cn } from "@/lib/utils";
import type { ScheduleBookingView } from "@/types";

/**
 * 支援者が体験リターンの日程を選ぶ画面。
 * メールのリンク（/schedule/[token]）とマイページ（/dashboard/schedules/[id]）の両方で使う。
 */
export default function SchedulePicker({
  endpoint,
  backHref,
  backLabel,
}: {
  /** GET で内容、POST で予約する API */
  endpoint: string;
  backHref?: string;
  backLabel?: string;
}) {
  const [view, setView] = useState<ScheduleBookingView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<"book" | "cancel" | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(endpoint);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "日程調整が見つかりません");
        setView(data.view);
        setSelected(data.view.slotIds);
        setMessage(data.view.message || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "日程調整が見つかりません");
      } finally {
        setLoading(false);
      }
    })();
  }, [endpoint]);

  const days = useMemo(() => {
    const map = new Map<string, ScheduleBookingView["slots"]>();
    for (const s of view?.slots ?? []) {
      const key = jstDateKey(s.startsAt);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.values()];
  }, [view]);

  /** 口数が1なら選び直し、2以上なら口数まで複数選べる */
  const toggle = (slotId: string) => {
    if (!view) return;
    setSelected((cur) => {
      if (cur.includes(slotId)) return cur.filter((id) => id !== slotId);
      if (view.tickets <= 1) return [slotId];
      if (cur.length >= view.tickets) {
        toast.error(`選べるのは${view.tickets}枠までです。ほかの枠を外してから選んでください`);
        return cur;
      }
      return [...cur, slotId];
    });
  };

  const submit = async (slotIds: string[]) => {
    if (slotIds.length === 0 && !window.confirm("予約をすべて取り消します。よろしいですか？")) return;
    setSaving(slotIds.length > 0 ? "book" : "cancel");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotIds, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.view) {
        setView(data.view);
        setSelected(data.view.slotIds);
      }
      if (!res.ok) throw new Error(data.error || "保存できませんでした");
      setEditing(false);
      toast.success(
        slotIds.length > 0 ? "日程を受け付けました。確認メールをお送りしました" : "予約を取り消しました"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存できませんでした");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <Loader2 size={24} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  if (error || !view) {
    return (
      <Shell>
        <h1 className="font-bold text-ink text-lg">日程調整が見つかりません</h1>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">
          {error ?? "リンクをご確認ください。"}
        </p>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">
          案内メールが複数届いている場合は、いちばん新しいメールのリンクをお使いください。
        </p>
      </Shell>
    );
  }

  const booked = view.slots.filter((s) => view.slotIds.includes(s.id));
  const rest = Math.max(0, view.tickets - booked.length);
  const showPicker = view.canChange && view.tickets > 0 && (rest > 0 || editing);
  const sameSelection =
    selected.length === view.slotIds.length && selected.every((id) => view.slotIds.includes(id));
  const dirty = !sameSelection || message.trim() !== view.message;

  return (
    <Shell>
      {backHref && (
        <Link href={backHref} className="text-sm text-ink-muted hover:text-ink">
          ← {backLabel ?? "戻る"}
        </Link>
      )}
      <p className={cn("text-xs font-bold text-ink-muted", backHref && "mt-4")}>
        {view.project.title}
        {view.rewardTitle && ` ・ ${view.rewardTitle}`}
      </p>
      <h1
        className="mt-1 text-xl font-bold text-ink"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {view.schedule.title}
      </h1>
      {view.name && (
        <p className="mt-1 text-sm text-ink-soft">{view.name} さん</p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        {view.schedule.durationMinutes && (
          <span className="inline-flex items-center gap-1">
            <Clock size={13} />
            所要 約{view.schedule.durationMinutes}分
          </span>
        )}
        {view.schedule.deadline && (
          <span className="font-bold text-caramel-700">
            回答期限: {formatDeadline(view.schedule.deadline)}
          </span>
        )}
      </div>

      {view.schedule.description && (
        <p className="mt-4 text-sm text-ink-soft leading-relaxed whitespace-pre-wrap break-words">
          {view.schedule.description}
        </p>
      )}

      {booked.length > 0 && (
        <div className="mt-6 rounded-xl border border-caramel-300 bg-caramel-50 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-caramel-700">
            <CalendarCheck size={14} />
            予約済み{view.tickets > 1 && `（${booked.length}/${view.tickets}枠）`}
          </p>
          <ul className="mt-1 space-y-1">
            {booked.map((b) => (
              <li key={b.id}>
                <p className="text-lg font-bold text-ink tabular-nums">
                  {formatSlotTime(b.startsAt, view.schedule.durationMinutes)}
                </p>
                {b.note && <p className="text-sm text-ink-soft">{b.note}</p>}
              </li>
            ))}
          </ul>
          {view.schedule.location && (
            <div className="mt-3 text-sm text-ink-soft">
              <p className="flex items-center gap-1 text-xs font-bold text-ink-muted">
                <MapPin size={13} />
                場所・参加方法
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words">{view.schedule.location}</p>
            </div>
          )}
          {view.canChange && !editing && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                日程を変更する
              </Button>
              <Button
                size="sm"
                variant="ghost"
                loading={saving === "cancel"}
                onClick={() => submit([])}
              >
                {booked.length > 1 ? "すべて取り消す" : "予約を取り消す"}
              </Button>
            </div>
          )}
        </div>
      )}

      {view.tickets === 0 && booked.length === 0 && (
        <p className="mt-6 rounded-lg bg-cream-100 px-4 py-3 text-sm text-ink-soft">
          このリターンの対象となるご支援が見つかりませんでした。お心当たりがない場合は、プロジェクトページから掲載者へお問い合わせください。
        </p>
      )}

      {!view.canChange && (
        <p className="mt-6 rounded-lg bg-cream-100 px-4 py-3 text-sm text-ink-soft">
          {view.schedule.status === "closed"
            ? "この日程調整の受付は終了しました。"
            : "回答期限を過ぎたため、日程の選択・変更はできません。"}
          {rest > 0 && "ご都合がつかない場合は、プロジェクトページから掲載者へお問い合わせください。"}
        </p>
      )}

      {showPicker && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-ink">
            {view.tickets > 1
              ? `ご都合のよい日程を${view.tickets}つまで選んでください`
              : booked.length > 0
                ? "変更後の日程を選んでください"
                : "ご都合のよい日程を1つ選んでください"}
          </h2>
          {view.tickets > 1 && (
            <p className="mt-1 text-xs text-ink-muted">
              {view.tickets}口ご支援いただいているので、{view.tickets}回分の日程を選べます（同じ枠は1回まで）。いま{selected.length}枠を選択中です
            </p>
          )}
          {days.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              選べる日程がまだありません。掲載者が候補を追加するまでお待ちください。
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              {days.map((slots) => (
                <div key={slots[0].startsAt}>
                  <p className="text-xs font-bold text-ink-muted mb-2">
                    {formatJstDate(slots[0].startsAt)}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map((s) => {
                      const chosen = selected.includes(s.id);
                      const disabled =
                        !view.slotIds.includes(s.id) && (s.isPast || s.remaining <= 0);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => toggle(s.id)}
                          aria-pressed={chosen}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-left transition-colors",
                            chosen
                              ? "border-ink bg-ink text-white"
                              : "border-line-strong bg-white text-ink hover:bg-cream-50",
                            disabled && "opacity-40 cursor-not-allowed hover:bg-white"
                          )}
                        >
                          <span className="block font-bold tabular-nums">
                            {formatJstTime(s.startsAt)}〜
                          </span>
                          <span
                            className={cn(
                              "block text-[11px]",
                              chosen ? "text-white/80" : "text-ink-muted"
                            )}
                          >
                            {s.isPast
                              ? "終了"
                              : s.remaining <= 0
                                ? "満席"
                                : `残り${s.remaining}`}
                            {s.note && ` ・ ${s.note}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5">
            <Textarea
              label="掲載者へのメッセージ（任意）"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="当日の連絡先や、伝えておきたいことがあればご記入ください"
              fullWidth
            />
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {editing && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setSelected(view.slotIds);
                  setMessage(view.message);
                }}
              >
                やめる
              </Button>
            )}
            <Button
              loading={saving === "book"}
              disabled={selected.length === 0 || !dirty || saving !== null}
              onClick={() => submit(selected)}
            >
              {booked.length > 0
                ? "この内容で更新する"
                : selected.length > 1
                  ? `この${selected.length}枠で申し込む`
                  : "この日程で申し込む"}
            </Button>
          </div>
        </div>
      )}

      <p className="mt-8 text-xs text-ink-muted">
        <Link href={view.project.path} className="underline hover:text-ink">
          プロジェクトページを見る
        </Link>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-16 px-4">
      <div className="max-w-xl mx-auto rounded-xl border border-line bg-white p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
