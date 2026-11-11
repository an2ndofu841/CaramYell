"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { formatJstDate, jstInputToIso, UNDECIDED_TIME } from "@/lib/schedule/time";

/**
 * 追加する枠。startsAt は日本時間の「2026-12-05T19:00」。
 * 時間未定の枠は timeLabel に「ライブ前後」などを入れ、startsAt はその日の 23:59 にする
 */
export type DraftSlot = { startsAt: string; capacity: number; note: string; timeLabel: string };

/** 同じ枠かどうかの判定に使うキー（時間未定の枠は表記ごとに別の枠） */
export const slotKey = (s: { startsAt: string; timeLabel: string }) => `${s.startsAt}|${s.timeLabel}`;

const MAX_PER_ADD = 200;
const TIME_LABEL_PRESETS = ["ライブ前後", "ライブ前", "ライブ後", "時間未定"];

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const toTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** 「12月5日(土)」 */
export const shortDate = (date: string) =>
  formatJstDate(jstInputToIso(`${date}T00:00`) ?? "").replace(/^\d+年/, "");

const todayJst = () => new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);

/**
 * 候補の枠をまとめて作る入力欄。
 * 日付を複数選び、「19:00〜20:00を15分ごと」のように時間帯を決めると、日付 × 時刻の枠ができる。
 * 時刻が決まっていなければ「ライブ前後」などの表記で、日付ごとに1枠ずつ作れる。
 */
export default function SlotBuilder({
  durationMinutes,
  existing = [],
  title,
  addLabel,
  onAdd,
}: {
  durationMinutes: number | null;
  /** すでにある枠の slotKey（同じ枠は足さない） */
  existing?: string[];
  title: string;
  addLabel: string;
  /** 追加できたら true を返す（入力中の日付をクリアする） */
  onAdd: (slots: DraftSlot[]) => Promise<boolean> | boolean;
}) {
  const [dates, setDates] = useState<string[]>([]);
  const [undecided, setUndecided] = useState(false);
  const [timeLabel, setTimeLabel] = useState(TIME_LABEL_PRESETS[0]);
  const [start, setStart] = useState("19:00");
  const [end, setEnd] = useState("");
  const [interval, setIntervalMinutes] = useState(String(durationMinutes ?? 30));
  const [intervalTouched, setIntervalTouched] = useState(false);
  const [capacity, setCapacity] = useState("1");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // 所要時間を変えたら、間隔もそれに合わせる（自分で間隔を変えていなければ）
  useEffect(() => {
    if (!intervalTouched && durationMinutes) setIntervalMinutes(String(durationMinutes));
  }, [durationMinutes, intervalTouched]);

  const label = undecided ? timeLabel.trim() : "";

  const times = useMemo(() => {
    if (undecided) return label ? [UNDECIDED_TIME] : [];
    if (!/^\d{2}:\d{2}$/.test(start)) return [];
    if (!end) return [start];
    if (!/^\d{2}:\d{2}$/.test(end)) return [];
    const step = Math.max(Number(interval) || 0, 5);
    const length = durationMinutes ?? step;
    const out: string[] = [];
    for (let t = toMinutes(start); t + length <= toMinutes(end); t += step) out.push(toTime(t));
    return out;
  }, [undecided, label, start, end, interval, durationMinutes]);

  const { slots, skippedPast, skippedDup } = useMemo(() => {
    const now = Date.now();
    let past = 0;
    let dup = 0;
    const list: DraftSlot[] = [];
    for (const d of dates) {
      for (const t of times) {
        const slot = { startsAt: `${d}T${t}`, capacity: Number(capacity) || 1, note: note.trim(), timeLabel: label };
        if (new Date(`${slot.startsAt}:00+09:00`).getTime() <= now) past++;
        else if (existing.includes(slotKey(slot))) dup++;
        else list.push(slot);
      }
    }
    return { slots: list, skippedPast: past, skippedDup: dup };
  }, [dates, times, capacity, note, label, existing]);

  const summary = (() => {
    if (dates.length === 0) return "日付を選んでください";
    if (undecided && !label) return "時間の表記を入力してください";
    if (times.length === 0) return "終了時刻までに収まる枠がありません。開始・終了・間隔を確認してください";
    const range = undecided
      ? `「${label}」の1枠`
      : times.length > 1
        ? `${times[0]}〜${times[times.length - 1]}開始の${times.length}枠`
        : `${times[0]}開始の1枠`;
    const skipped = [
      skippedPast > 0 ? `過ぎた日時${skippedPast}枠` : null,
      skippedDup > 0 ? `作成済み${skippedDup}枠` : null,
    ].filter(Boolean);
    return `${dates.length}日 × ${range} ＝ ${slots.length}枠${
      skipped.length > 0 ? `（${skipped.join("・")}は除きます）` : ""
    }`;
  })();

  const add = async () => {
    if (slots.length > MAX_PER_ADD) {
      toast.error(`一度に追加できるのは${MAX_PER_ADD}枠までです`);
      return;
    }
    setSaving(true);
    try {
      if (await onAdd(slots)) {
        setDates([]);
        setNote("");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg bg-cream-50 border border-line p-4">
      <p className="text-xs font-bold text-ink mb-3">{title}</p>
      <div className="space-y-3">
        <div>
          <Input
            label="日付（複数選べます）"
            type="date"
            min={todayJst()}
            value=""
            onChange={(e) => {
              const d = e.target.value;
              if (d) setDates((cur) => (cur.includes(d) ? cur : [...cur, d].sort()));
            }}
            fullWidth
          />
          {dates.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {dates.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-white pl-3 pr-1.5 py-1 text-xs font-bold text-ink"
                >
                  {shortDate(d)}
                  <button
                    type="button"
                    className="p-0.5 text-ink-faint hover:text-red-600"
                    aria-label={`${shortDate(d)}を外す`}
                    onClick={() => setDates((cur) => cur.filter((x) => x !== d))}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-ink mb-1.5">時間</p>
          <div className="inline-flex rounded-lg border border-line-strong bg-white p-0.5">
            {(
              [
                { value: false, label: "時刻を決める" },
                { value: true, label: "時間未定（ライブ前後など）" },
              ] as const
            ).map((m) => (
              <button
                key={m.label}
                type="button"
                aria-pressed={undecided === m.value}
                onClick={() => setUndecided(m.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-bold transition-colors",
                  undecided === m.value ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {undecided ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2 sm:col-span-3">
                <Input
                  label="時間の表記"
                  value={timeLabel}
                  onChange={(e) => setTimeLabel(e.target.value)}
                  maxLength={30}
                  placeholder="例: ライブ前後"
                  fullWidth
                />
              </div>
              <Input
                label="1枠の定員"
                type="number"
                min={1}
                max={1000}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                fullWidth
              />
            </div>
            <div className="-mt-1 flex flex-wrap gap-1.5">
              {TIME_LABEL_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTimeLabel(p)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors",
                    timeLabel === p
                      ? "border-ink bg-ink text-white"
                      : "border-line-strong bg-white text-ink-muted hover:text-ink"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-muted">
              時刻の代わりにこの表記を支援者に見せます。選んだ日付ごとに1枠ずつ作ります
            </p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input label="開始" type="time" value={start} onChange={(e) => setStart(e.target.value)} fullWidth />
              <Input
                label="終了（任意）"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                fullWidth
              />
              <Input
                label="間隔（分）"
                type="number"
                min={5}
                value={interval}
                onChange={(e) => {
                  setIntervalTouched(true);
                  setIntervalMinutes(e.target.value);
                }}
                disabled={!end}
                fullWidth
              />
              <Input
                label="1枠の定員"
                type="number"
                min={1}
                max={1000}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                fullWidth
              />
            </div>
            <p className="text-xs text-ink-muted -mt-1">
              終了を入れると、終了時刻までに終わる枠を間隔ごとに作ります。空欄なら開始時刻の1枠だけです（日本時間）
            </p>
          </>
        )}
        <Input
          label="補足（任意）"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder="例: 昼の部 / 新宿駅集合"
          fullWidth
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-muted tabular-nums">{summary}</p>
        <Button size="sm" icon={<Plus size={14} />} loading={saving} disabled={slots.length === 0} onClick={add}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
