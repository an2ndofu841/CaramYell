"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Check, Clock, Loader2, MapPin, PencilLine } from "lucide-react";
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

const MAX_PREFERENCES = 3;
const rankLabel = (i: number) => `第${i + 1}希望`;

/**
 * 支援者が体験リターンの日程の希望を回答する画面。
 * 候補の枠から第3希望までを選び、合う日時が無ければ「その他」に書く。掲載者の質問にも答える。
 * 日程は回答をもとに掲載者が確定する。
 * メールのリンク（/schedule/[token]）とマイページ（/dashboard/schedules/[id]）の両方で使う。
 */
export default function SchedulePicker({
  endpoint,
  preview,
  backHref,
  backLabel,
}: {
  /** GET で内容、POST で回答する API */
  endpoint?: string;
  /** 掲載者が作成中に見るプレビュー。API を呼ばず、送信もしない */
  preview?: ScheduleBookingView;
  backHref?: string;
  backLabel?: string;
}) {
  const [view, setView] = useState<ScheduleBookingView | null>(preview ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!preview);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [otherOn, setOtherOn] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const resetFrom = (v: ScheduleBookingView) => {
    setPrefs(v.preferredSlotIds);
    setOtherText(v.otherText);
    setOtherOn(Boolean(v.otherText));
    setAnswers(v.answers);
    setMessage(v.message);
  };

  useEffect(() => {
    if (!endpoint) return;
    (async () => {
      try {
        const res = await fetch(endpoint);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "日程調整が見つかりません");
        setView(data.view);
        resetFrom(data.view);
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

  /** 押した順に第1・第2・第3希望。選び済みを押すと外れて、後ろの希望が繰り上がる */
  const toggle = (slotId: string) => {
    setPrefs((cur) => {
      if (cur.includes(slotId)) return cur.filter((id) => id !== slotId);
      if (cur.length >= MAX_PREFERENCES) {
        toast.error(`選べるのは${rankLabel(MAX_PREFERENCES - 1)}までです。どれかを外してから選んでください`);
        return cur;
      }
      return [...cur, slotId];
    });
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

  const { schedule } = view;
  const slotById = new Map(view.slots.map((s) => [s.id, s]));
  const confirmed = view.slots.filter((s) => view.slotIds.includes(s.id));
  const fullyConfirmed = view.tickets > 0 && confirmed.length >= view.tickets;
  const answered = Boolean(view.submittedAt);
  const showForm = view.canChange && view.tickets > 0 && !fullyConfirmed && (!answered || editing);
  // 候補の枠が無ければ「その他」の欄をそのまま出す
  const otherOnly = schedule.allowOther && view.slots.length === 0;
  const otherActive = schedule.allowOther && (otherOnly || otherOn);
  const missingRequired = schedule.questions.filter((q) => q.required && !answers[q.id]?.trim());
  const needsChoice = view.slots.length > 0 || schedule.allowOther;
  const hasChoice = prefs.length > 0 || (otherActive && otherText.trim().length > 0);
  const canSubmit = (!needsChoice || hasChoice) && missingRequired.length === 0;

  const submit = async () => {
    if (!endpoint) {
      toast.info("プレビューのため送信されません");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredSlotIds: prefs,
          otherText: otherActive ? otherText : "",
          answers,
          message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.view) setView(data.view);
      if (!res.ok) throw new Error(data.error || "送信できませんでした");
      resetFrom(data.view);
      setEditing(false);
      toast.success("ご希望を受け付けました。控えをメールでお送りしました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "送信できませんでした");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell bare={Boolean(preview)}>
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
        {schedule.title}
      </h1>
      {view.name && <p className="mt-1 text-sm text-ink-soft">{view.name} さん</p>}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        {schedule.durationMinutes && (
          <span className="inline-flex items-center gap-1">
            <Clock size={13} />
            所要 約{schedule.durationMinutes}分
          </span>
        )}
        {schedule.deadline && (
          <span className="font-bold text-caramel-700">
            回答期限: {formatDeadline(schedule.deadline)}
          </span>
        )}
      </div>

      {schedule.description && (
        <p className="mt-4 text-sm text-ink-soft leading-relaxed whitespace-pre-wrap break-words">
          {schedule.description}
        </p>
      )}

      {confirmed.length > 0 && (
        <div className="mt-6 rounded-xl border border-caramel-300 bg-caramel-50 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-caramel-700">
            <CalendarCheck size={14} />
            日程が決まりました{view.tickets > 1 && `（${confirmed.length}/${view.tickets}回分）`}
          </p>
          <ul className="mt-1 space-y-1">
            {confirmed.map((b) => (
              <li key={b.id}>
                <p className="text-lg font-bold text-ink tabular-nums">
                  {formatSlotTime(b.startsAt, schedule.durationMinutes)}
                </p>
                {b.note && <p className="text-sm text-ink-soft">{b.note}</p>}
              </li>
            ))}
          </ul>
          {schedule.location && (
            <div className="mt-3 text-sm text-ink-soft">
              <p className="flex items-center gap-1 text-xs font-bold text-ink-muted">
                <MapPin size={13} />
                場所・参加方法
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words">{schedule.location}</p>
            </div>
          )}
          {fullyConfirmed && (
            <p className="mt-3 text-xs text-ink-muted">
              日程の変更が必要な場合は、プロジェクトページから掲載者へご連絡ください。
            </p>
          )}
        </div>
      )}

      {view.cancelled && (
        <p className="mt-6 rounded-lg border border-caramel-300 bg-caramel-50 px-4 py-3 text-sm text-ink-soft">
          お知らせしていた日程は取り消しになりました。
          {view.canChange
            ? "お手数ですが、あらためてご希望の日程をお選びください。"
            : "あらためて掲載者からご連絡します。"}
        </p>
      )}

      {view.tickets === 0 && confirmed.length === 0 && (
        <p className="mt-6 rounded-lg bg-cream-100 px-4 py-3 text-sm text-ink-soft">
          {view.excluded
            ? "この日程調整へのご回答は不要になりました。ご不明な点は、プロジェクトページから掲載者へお問い合わせください。"
            : "このリターンの対象となるご支援が見つかりませんでした。お心当たりがない場合は、プロジェクトページから掲載者へお問い合わせください。"}
        </p>
      )}

      {!view.canChange && !fullyConfirmed && (
        <p className="mt-6 rounded-lg bg-cream-100 px-4 py-3 text-sm text-ink-soft">
          {schedule.status === "closed"
            ? "この日程調整の受付は終了しました。"
            : "回答期限を過ぎたため、回答の送信・変更はできません。"}
          {answered
            ? "いただいたご希望をもとに、掲載者が日程を決めてご連絡します。"
            : "ご都合がつかない場合は、プロジェクトページから掲載者へお問い合わせください。"}
        </p>
      )}

      {answered && !fullyConfirmed && !showForm && (
        <div className="mt-6 rounded-xl border border-line bg-cream-50 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-ink-muted">
            <Check size={14} />
            ご回答ありがとうございます
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {confirmed.length > 0
              ? "残りの日程は、掲載者が決まりしだいメールでお知らせします。"
              : "ご希望をもとに掲載者が日程を決め、メールでお知らせします。"}
          </p>
          <AnswerSummary view={view} slotById={slotById} />
          {view.canChange && (
            <div className="mt-4">
              <Button
                size="sm"
                variant="outline"
                icon={<PencilLine size={14} />}
                onClick={() => setEditing(true)}
              >
                回答を変更する
              </Button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="mt-6">
          {view.slots.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-ink">
                ご都合のよい日程を{rankLabel(MAX_PREFERENCES - 1)}まで選んでください
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                押した順に第1・第2・第3希望になります。もう一度押すと外せます。ご希望をもとに掲載者が日程を決め、メールでお知らせします
              </p>
              {view.tickets > 1 && (
                <p className="mt-1 text-xs text-ink-muted">
                  {view.tickets}口ご支援いただいているので、{view.tickets}回分の日程をご希望の中から決めます
                </p>
              )}
              <div className="mt-3 space-y-4">
                {days.map((slots) => (
                  <div key={slots[0].startsAt}>
                    <p className="text-xs font-bold text-ink-muted mb-2">
                      {formatJstDate(slots[0].startsAt)}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {slots.map((s) => {
                        const rank = prefs.indexOf(s.id);
                        const chosen = rank >= 0;
                        const disabled =
                          !view.preferredSlotIds.includes(s.id) && (s.isPast || s.remaining <= 0);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggle(s.id)}
                            aria-pressed={chosen}
                            className={cn(
                              "relative rounded-lg border px-3 py-2.5 text-left transition-colors",
                              chosen
                                ? "border-ink bg-ink text-white"
                                : "border-line-strong bg-white text-ink hover:bg-cream-50",
                              disabled && "opacity-40 cursor-not-allowed hover:bg-white"
                            )}
                          >
                            {chosen && (
                              <span className="absolute -top-2 right-2 rounded-full bg-caramel-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                {rankLabel(rank)}
                              </span>
                            )}
                            <span className="block font-bold tabular-nums">
                              {formatJstTime(s.startsAt)}〜
                            </span>
                            <span
                              className={cn(
                                "block text-[11px]",
                                chosen ? "text-white/80" : "text-ink-muted"
                              )}
                            >
                              {s.isPast ? "終了" : s.remaining <= 0 ? "満席" : `残り${s.remaining}`}
                              {s.note && ` ・ ${s.note}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {schedule.allowOther && (
                  <button
                    type="button"
                    onClick={() => setOtherOn((v) => !v)}
                    aria-pressed={otherOn}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-left text-sm font-bold transition-colors",
                      otherOn
                        ? "border-ink bg-ink text-white"
                        : "border-line-strong bg-white text-ink hover:bg-cream-50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border",
                        otherOn ? "border-white bg-white text-ink" : "border-line-strong"
                      )}
                    >
                      {otherOn && <Check size={12} strokeWidth={3} />}
                    </span>
                    その他（候補以外の日時を希望する）
                  </button>
                )}
              </div>

              {prefs.length > 0 && (
                <ol className="mt-3 space-y-0.5 rounded-lg bg-cream-50 px-3 py-2 text-sm text-ink">
                  {prefs.map((id, i) => {
                    const s = slotById.get(id);
                    return (
                      s && (
                        <li key={id} className="tabular-nums">
                          <span className="font-bold text-caramel-700">{rankLabel(i)}</span>{" "}
                          {formatSlotTime(s.startsAt, schedule.durationMinutes)}
                        </li>
                      )
                    );
                  })}
                </ol>
              )}
            </>
          )}

          {otherActive && (
            <div className={cn(!otherOnly && "mt-4")}>
              <Textarea
                label={otherOnly ? "ご希望の日時" : "その他のご希望"}
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="例: 11月20日(金) 20時以降 / 平日の夜ならいつでも など"
                fullWidth
              />
            </div>
          )}

          {schedule.questions.map((q) => (
            <div key={q.id} className="mt-4">
              <Textarea
                label={`${q.label}${q.required ? "（必須）" : "（任意）"}`}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((cur) => ({ ...cur, [q.id]: e.target.value }))}
                rows={3}
                maxLength={1000}
                placeholder={q.placeholder}
                fullWidth
              />
            </div>
          ))}

          <div className="mt-4">
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

          {!canSubmit && (
            <p className="mt-3 text-xs text-ink-muted">
              {needsChoice && !hasChoice
                ? schedule.allowOther
                  ? "希望の日程を選ぶか、「その他」にご希望をご記入ください"
                  : "希望の日程を1つ以上選んでください"
                : `「${missingRequired[0]?.label}」をご記入ください`}
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {editing && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  resetFrom(view);
                }}
              >
                やめる
              </Button>
            )}
            <Button loading={saving} disabled={!canSubmit || saving} onClick={submit}>
              {answered ? "この内容で更新する" : "この内容で回答する"}
            </Button>
          </div>
        </div>
      )}

      {!preview && (
        <p className="mt-8 text-xs text-ink-muted">
          <Link href={view.project.path} className="underline hover:text-ink">
            プロジェクトページを見る
          </Link>
        </p>
      )}
    </Shell>
  );
}

/** 送った回答の控え */
function AnswerSummary({
  view,
  slotById,
}: {
  view: ScheduleBookingView;
  slotById: Map<string, ScheduleBookingView["slots"][number]>;
}) {
  const answered = view.schedule.questions.filter((q) => view.answers[q.id]);
  return (
    <dl className="mt-3 space-y-2 text-sm">
      {view.preferredSlotIds.map((id, i) => {
        const s = slotById.get(id);
        return (
          s && (
            <div key={id} className="flex gap-2">
              <dt className="w-16 flex-shrink-0 text-xs font-bold text-caramel-700 pt-0.5">
                {rankLabel(i)}
              </dt>
              <dd className="text-ink tabular-nums">
                {formatSlotTime(s.startsAt, view.schedule.durationMinutes)}
              </dd>
            </div>
          )
        );
      })}
      {view.otherText && (
        <div>
          <dt className="text-xs font-bold text-ink-muted">その他のご希望</dt>
          <dd className="text-ink whitespace-pre-wrap break-words">{view.otherText}</dd>
        </div>
      )}
      {answered.map((q) => (
        <div key={q.id}>
          <dt className="text-xs font-bold text-ink-muted">{q.label}</dt>
          <dd className="text-ink whitespace-pre-wrap break-words">{view.answers[q.id]}</dd>
        </div>
      ))}
      {view.message && (
        <div>
          <dt className="text-xs font-bold text-ink-muted">掲載者へのメッセージ</dt>
          <dd className="text-ink whitespace-pre-wrap break-words">{view.message}</dd>
        </div>
      )}
    </dl>
  );
}

function Shell({ children, bare }: { children: React.ReactNode; bare?: boolean }) {
  if (bare) return <div>{children}</div>;
  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-16 px-4">
      <div className="max-w-xl mx-auto rounded-xl border border-line bg-white p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
