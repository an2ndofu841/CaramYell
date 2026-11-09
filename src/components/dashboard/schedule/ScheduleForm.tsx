"use client";

import { useMemo, useState } from "react";
import { Eye, Plus, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { jstInputToIso } from "@/lib/schedule/time";
import { cn } from "@/lib/utils";
import type { Reward, ScheduleBookingView, ScheduleQuestion, ScheduleTargetPreview } from "@/types";
import SchedulePreviewModal, { buildPreviewView } from "./SchedulePreviewModal";
import SlotBuilder, { shortDate, type DraftSlot } from "./SlotBuilder";

const fieldLabel = "text-sm font-bold text-ink";
const selectClass =
  "w-full h-11 rounded-xl border border-line-strong bg-white px-3.5 text-ink outline-none focus:border-caramel-400 focus:ring-4 focus:ring-caramel-200/50";

export type ScheduleValues = {
  rewardId: string;
  title: string;
  description: string;
  location: string;
  durationMinutes: string;
  deadline: string;
  allowOther: boolean;
  questions: ScheduleQuestion[];
};

export type ScheduleSubmitValues = Omit<ScheduleValues, "durationMinutes"> & {
  durationMinutes: number | null;
};

/** 日時の決め方。free は候補を作らず、支援者に都合のよい日時を書いてもらう */
type SlotMode = "slots" | "free";

type QuestionPreset = Omit<ScheduleQuestion, "id">;

const CONTACT: QuestionPreset = {
  label: "当日の連絡先（電話番号やSNSのIDなど）",
  placeholder: "例: 090-xxxx-xxxx",
  required: false,
};
const CALL_NAME: QuestionPreset = {
  label: "当日お呼びするお名前（ニックネーム）",
  placeholder: "例: さくら",
  required: false,
};
const QUESTION_PRESETS = [CONTACT, CALL_NAME];

type Template = {
  label: string;
  title: string;
  description: string;
  durationMinutes: string;
  mode: SlotMode;
  allowOther: boolean;
  questions: QuestionPreset[];
};

const TEMPLATES: Template[] = [
  {
    label: "オンライン通話会",
    title: "オンライン通話会",
    description:
      "1対1でお話しできるオンライン通話会です。\n通話はZoomで行います。日程が決まった方には、当日の参加URLをお送りします。",
    durationMinutes: "10",
    mode: "slots",
    allowOther: true,
    questions: [CALL_NAME],
  },
  {
    label: "撮影会・チェキ会",
    title: "撮影会",
    description: "撮影会の日程調整です。\n集合場所・持ち物は、日程が決まった方にお知らせします。",
    durationMinutes: "30",
    mode: "slots",
    allowOther: false,
    questions: [],
  },
  {
    label: "お出かけ・食事会",
    title: "お出かけ",
    description:
      "一緒にお出かけするリターンの日程調整です。\n集合場所と当日の流れは、日程が決まった方にお知らせします。",
    durationMinutes: "120",
    mode: "slots",
    allowOther: true,
    questions: [{ ...CONTACT, required: true }],
  },
  {
    label: "候補日時を支援者に出してもらう",
    title: "日程調整",
    description:
      "ご都合のよい日時をいくつか教えてください。いただいた候補をもとに日程を決めて、あらためてご連絡します。",
    durationMinutes: "",
    mode: "free",
    allowOther: true,
    questions: [],
  },
];

const newQuestion = (preset?: QuestionPreset): ScheduleQuestion => ({
  id: crypto.randomUUID(),
  label: preset?.label ?? "",
  placeholder: preset?.placeholder ?? "",
  required: preset?.required ?? false,
});

/**
 * 日程調整の作成・編集フォーム。
 * 作成時は、ひな形・日時の決め方・候補の枠までここで決めて、まとめて作れる。
 * 編集時は、候補の枠は日程調整のカード側で足し引きする。
 */
export default function ScheduleForm({
  rewards,
  targets,
  projectTitle,
  initial,
  existingSlots,
  onSubmit,
  onCancel,
}: {
  rewards: Reward[];
  targets: Record<string, ScheduleTargetPreview[]>;
  projectTitle: string;
  initial?: Partial<ScheduleValues>;
  /** 編集時のプレビューに使う、作成済みの枠 */
  existingSlots?: ScheduleBookingView["slots"];
  onSubmit: (values: ScheduleSubmitValues, slots: DraftSlot[]) => Promise<void>;
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
    allowOther: initial?.allowOther ?? true,
    questions: initial?.questions ?? [],
  });
  const [mode, setMode] = useState<SlotMode>("slots");
  const [drafts, setDrafts] = useState<DraftSlot[]>([]);
  const [template, setTemplate] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k: "title" | "description" | "location" | "durationMinutes" | "deadline") =>
    (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const setQuestion = (id: string, patch: Partial<ScheduleQuestion>) =>
    setValues((v) => ({
      ...v,
      questions: v.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));

  const reward = rewards.find((r) => r.id === values.rewardId);
  const rewardTargets = targets[values.rewardId] ?? [];
  const questionsValid = values.questions.every((q) => q.label.trim());
  const duration = values.durationMinutes ? Number(values.durationMinutes) : null;
  const useDrafts = !editing && mode === "slots";
  const allowOther = !editing && mode === "free" ? true : values.allowOther;

  const applyTemplate = (t: Template) => {
    const dirty = values.title.trim() || values.description.trim() || values.questions.length > 0;
    if (dirty && template !== t.label && !window.confirm("入力中の内容を、ひな形の内容で置き換えます。よろしいですか？")) {
      return;
    }
    setTemplate(t.label);
    setMode(t.mode);
    setValues((v) => ({
      ...v,
      title: t.title,
      description: t.description,
      durationMinutes: t.durationMinutes,
      allowOther: t.allowOther,
      questions: t.questions.map((q) => newQuestion(q)),
    }));
  };

  const addDrafts = (slots: DraftSlot[]) => {
    const fresh = slots.filter((s) => !drafts.some((d) => d.startsAt === s.startsAt));
    if (fresh.length === 0) {
      toast.error("同じ日時の候補がすでにあります");
      return false;
    }
    setDrafts((cur) => [...cur, ...fresh].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
    return true;
  };

  const preview = useMemo(
    () =>
      buildPreviewView({
        projectTitle,
        rewardTitle: reward?.title ?? "",
        title: values.title,
        description: values.description,
        durationMinutes: duration,
        deadline: values.deadline ? jstInputToIso(values.deadline) : null,
        allowOther,
        questions: values.questions,
        slots: useDrafts
          ? drafts.map((d, i) => ({
              id: `draft-${i}`,
              startsAt: jstInputToIso(d.startsAt) ?? d.startsAt,
              note: d.note,
              remaining: d.capacity,
              isPast: false,
            }))
          : editing
            ? existingSlots ?? []
            : [],
      }),
    [projectTitle, reward, values, duration, allowOther, useDrafts, drafts, editing, existingSlots]
  );

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit(
        { ...values, allowOther, durationMinutes: duration },
        useDrafts ? drafts : []
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-xl">
      <h3 className="font-bold text-ink mb-4">{editing ? "日程調整を編集" : "新しい日程調整"}</h3>
      <div className="space-y-4">
        {!editing && (
          <div>
            <p className={fieldLabel}>ひな形から作る</p>
            <p className="text-xs text-ink-muted mt-0.5">
              選ぶと、タイトル・案内文・所要時間・質問が入ります。あとから自由に書き換えられます
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  aria-pressed={template === t.label}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors",
                    template === t.label
                      ? "border-ink bg-ink text-white"
                      : "border-line-strong bg-white text-ink hover:bg-cream-50"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!editing && (
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel}>対象のリターン</label>
            <select
              className={selectClass}
              value={values.rewardId}
              onChange={(e) => setValues((v) => ({ ...v, rewardId: e.target.value }))}
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
            <TargetPreview targets={rewardTargets} />
          </div>
        )}
        <Input
          label="タイトル"
          value={values.title}
          onChange={set("title")}
          placeholder="例: オンライン通話会"
          maxLength={100}
          fullWidth
        />
        <Textarea
          label="案内文"
          value={values.description}
          onChange={set("description")}
          rows={4}
          maxLength={3000}
          placeholder="内容・当日の流れ・持ち物・注意事項など。案内メールと回答画面に表示されます"
          fullWidth
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="1回の所要時間（分）"
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
            hint="日本時間。期限を過ぎると支援者は回答・変更できません"
            fullWidth
          />
        </div>
        <Textarea
          label="場所・参加方法"
          value={values.location}
          onChange={set("location")}
          rows={2}
          maxLength={1000}
          placeholder="例: Zoom https://zoom.us/j/xxxx / 新宿駅東口改札前"
          hint="集合場所や通話URLなど。日程が確定した支援者にだけ表示し、確定のお知らせメールにも記載します"
          fullWidth
        />

        {/* 日時の決め方と候補の枠 */}
        <div className="rounded-lg border border-line p-4 space-y-4">
          <div>
            <p className={fieldLabel}>{editing ? "支援者に回答してもらう内容" : "日時の決め方"}</p>
            {editing && (
              <p className="text-xs text-ink-muted mt-0.5">
                支援者は候補の日時から第3希望まで選べます。候補の日時は、日程調整のカードで追加・削除できます
              </p>
            )}
          </div>

          {!editing && (
            <div className="grid sm:grid-cols-2 gap-2">
              {(
                [
                  {
                    id: "slots",
                    label: "候補の日時から選んでもらう",
                    hint: "日時を並べて、支援者に第3希望まで選んでもらいます",
                  },
                  {
                    id: "free",
                    label: "支援者に都合のよい日時を書いてもらう",
                    hint: "候補は作らず、支援者が希望の日時を自由に書きます",
                  },
                ] as const
              ).map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border p-3 cursor-pointer transition-colors",
                    mode === m.id ? "border-ink bg-cream-50" : "border-line-strong hover:bg-cream-50"
                  )}
                >
                  <input
                    type="radio"
                    name="slot-mode"
                    className="mt-0.5 h-4 w-4 accent-caramel-600"
                    checked={mode === m.id}
                    onChange={() => setMode(m.id)}
                  />
                  <span>
                    <span className="block text-sm font-bold text-ink">{m.label}</span>
                    <span className="block text-xs text-ink-muted mt-0.5">{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {useDrafts && (
            <>
              <SlotBuilder
                durationMinutes={duration}
                existing={drafts.map((d) => d.startsAt)}
                title="候補の日時を追加（日本時間）"
                addLabel="候補に追加"
                onAdd={addDrafts}
              />
              <DraftSlotList
                slots={drafts}
                onRemove={(ids) => setDrafts((cur) => cur.filter((d) => !ids.includes(d.startsAt)))}
              />
            </>
          )}

          {(editing || mode === "slots") && (
            <label className="flex items-start gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-caramel-600"
                checked={values.allowOther}
                onChange={(e) => setValues((v) => ({ ...v, allowOther: e.target.checked }))}
              />
              <span>
                候補に合わない人のために「その他」（希望の日時を自由記入）を用意する
                {editing && (
                  <span className="block text-xs text-ink-muted">
                    候補の枠が1つも無いときは、支援者は「ご希望の日時」を書いて回答します
                  </span>
                )}
              </span>
            </label>
          )}

          {!editing && mode === "free" && (
            <p className="rounded-lg bg-cream-50 px-3 py-2 text-xs text-ink-soft">
              支援者の回答画面には「ご希望の日時」の記入欄が出ます。回答を見て日時を決めたら、その日時の枠をカードで追加して確定します
            </p>
          )}
        </div>

        {/* 質問 */}
        <div className="rounded-lg border border-line p-4 space-y-3">
          <div>
            <p className={fieldLabel}>質問（任意）</p>
            <p className="text-xs text-ink-muted mt-0.5">
              当日の連絡先など、日時のほかに書いてほしいことがあれば追加してください
            </p>
          </div>
          {values.questions.map((q, i) => (
            <div key={q.id} className="rounded-lg bg-cream-50 border border-line p-3 space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    label={`質問${i + 1}`}
                    value={q.label}
                    onChange={(e) => setQuestion(q.id, { label: e.target.value })}
                    maxLength={100}
                    placeholder="例: 当日お話ししたいことがあれば教えてください"
                    fullWidth
                  />
                </div>
                <button
                  type="button"
                  className="mt-8 p-1 text-ink-faint hover:text-red-600"
                  aria-label={`質問${i + 1}を削除`}
                  onClick={() =>
                    setValues((v) => ({ ...v, questions: v.questions.filter((x) => x.id !== q.id) }))
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <Input
                value={q.placeholder}
                onChange={(e) => setQuestion(q.id, { placeholder: e.target.value })}
                maxLength={200}
                placeholder="記入例（任意）: 入力欄に薄く表示されます"
                fullWidth
              />
              <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-caramel-600"
                  checked={q.required}
                  onChange={(e) => setQuestion(q.id, { required: e.target.checked })}
                />
                必須にする
              </label>
            </div>
          ))}
          {values.questions.length < 10 && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                icon={<Plus size={14} />}
                onClick={() => setValues((v) => ({ ...v, questions: [...v.questions, newQuestion()] }))}
              >
                質問を追加
              </Button>
              {QUESTION_PRESETS.filter((p) => !values.questions.some((q) => q.label === p.label)).map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  variant="ghost"
                  icon={<Plus size={14} />}
                  onClick={() => setValues((v) => ({ ...v, questions: [...v.questions, newQuestion(p)] }))}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" icon={<Eye size={16} />} onClick={() => setPreviewing(true)}>
          支援者の回答画面を見る
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            キャンセル
          </Button>
          <Button
            loading={saving}
            disabled={!values.title.trim() || !values.rewardId || !questionsValid}
            onClick={submit}
          >
            {editing ? "保存する" : useDrafts && drafts.length > 0 ? `作成する（候補${drafts.length}枠）` : "作成する"}
          </Button>
        </div>
      </div>
      {useDrafts && drafts.length === 0 && (
        <p className="mt-2 text-right text-xs text-ink-muted">候補の日時は、作成したあとにも追加できます</p>
      )}

      {previewing && <SchedulePreviewModal view={preview} onClose={() => setPreviewing(false)} />}
    </Card>
  );
}

/** 作成前の候補の枠（日ごと） */
function DraftSlotList({
  slots,
  onRemove,
}: {
  slots: DraftSlot[];
  onRemove: (startsAt: string[]) => void;
}) {
  const days = useMemo(() => {
    const map = new Map<string, DraftSlot[]>();
    for (const s of slots) {
      const key = s.startsAt.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.entries()];
  }, [slots]);

  if (days.length === 0) {
    return (
      <p className="text-xs text-ink-muted">
        まだ候補がありません。日付と時間帯を選んで「候補に追加」を押してください
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs font-bold text-ink mb-2">候補の日時（{slots.length}枠）</p>
      <ul className="divide-y divide-line rounded-lg border border-line">
        {days.map(([date, list]) => (
          <li key={date} className="flex items-start gap-3 px-3 py-2.5">
            <div className="w-24 flex-shrink-0 text-sm font-bold text-ink">{shortDate(date)}</div>
            <div className="flex-1 flex flex-wrap gap-1.5">
              {list.map((s) => (
                <span
                  key={s.startsAt}
                  className="inline-flex items-center gap-1 rounded-md border border-line bg-white pl-2 pr-1 py-0.5 text-xs text-ink tabular-nums"
                >
                  {s.startsAt.slice(11)}
                  {s.capacity > 1 && <span className="text-ink-muted">定員{s.capacity}</span>}
                  {s.note && <span className="text-ink-muted">{s.note}</span>}
                  <button
                    type="button"
                    className="p-0.5 text-ink-faint hover:text-red-600"
                    aria-label={`${shortDate(date)} ${s.startsAt.slice(11)}を外す`}
                    onClick={() => onRemove([s.startsAt])}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              className="text-xs text-ink-muted underline underline-offset-4 hover:text-red-600 flex-shrink-0"
              onClick={() => onRemove(list.map((s) => s.startsAt))}
            >
              この日を外す
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 作成前に、選んだリターンの対象者を見せる */
function TargetPreview({ targets }: { targets: ScheduleTargetPreview[] }) {
  if (targets.length === 0) {
    return (
      <p className="text-xs text-amber-700">
        いまこのリターンの対象になる支援者（メールアドレスあり）はいません
      </p>
    );
  }
  const tickets = targets.reduce((n, t) => n + t.tickets, 0);
  return (
    <details className="rounded-lg border border-line bg-cream-50 px-3 py-2 text-sm">
      <summary className="cursor-pointer text-xs font-bold text-ink">
        <Users size={13} className="inline -mt-0.5 mr-1" />
        対象の支援者 {targets.length}人{tickets > targets.length && `（合計${tickets}口）`}
      </summary>
      <ul className="mt-2 max-h-48 overflow-y-auto divide-y divide-line">
        {targets.map((t) => (
          <li key={t.email} className="flex items-center justify-between gap-3 py-1.5">
            <span className="min-w-0">
              <span className="block truncate text-ink">{t.name || "（お名前未入力）"}</span>
              <span className="block truncate text-xs text-ink-muted">{t.email}</span>
            </span>
            {t.tickets > 1 && <span className="text-xs text-ink-muted flex-shrink-0">{t.tickets}口</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}
