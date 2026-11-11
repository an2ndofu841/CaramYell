import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { managedBy } from "@/lib/project/access";
import { normalizeEmail } from "@/lib/project/digital-delivery";
import { loadPaidBackers } from "@/lib/project/paid-backers";
import type { Reward, RewardSchedule, RewardScheduleSlot, ScheduleQuestion } from "@/types";
import {
  BOOKING_COLUMNS,
  buildRoster,
  PARTICIPANT_COLUMNS,
  SCHEDULE_COLUMNS,
  SLOT_COLUMNS,
  sortSlots,
  type BookingRow,
  type ParticipantRow,
} from "./server";
import { jstInputToIso, UNDECIDED_TIME } from "./time";

/** 掲載者が管理できるプロジェクトか確かめて読む */
export async function loadManagedProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      supabase,
      user: null,
      project: null,
      denied: NextResponse.json({ error: "認証が必要です" }, { status: 401 }),
    } as const;
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, slug")
    .eq("id", projectId)
    .or(await managedBy(supabase, user.id))
    .maybeSingle();
  if (!project) {
    return {
      supabase,
      user,
      project: null,
      denied: NextResponse.json({ error: "権限がありません" }, { status: 403 }),
    } as const;
  }
  return { supabase, user, project, denied: null } as const;
}

export const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

/**
 * 日程調整1件を、枠・対象者（回答・確定の状況）つきで読む（呼び出し側で権限確認済み）。
 * schedule が null なら見つからない。error はDBの読み込み失敗。
 */
export async function loadScheduleRoster(
  supabase: SupabaseClient,
  projectId: string,
  scheduleId: string
) {
  const { data: scheduleRow, error: scheduleError } = await supabase
    .from("reward_schedules")
    .select(SCHEDULE_COLUMNS)
    .eq("id", scheduleId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (scheduleError || !scheduleRow) {
    return { schedule: null, roster: [], backers: [], rewards: [], error: scheduleError };
  }

  const [
    { backers, error: backersError },
    { data: rewards, error: rewardsError },
    { data: participants, error: participantsError },
    { data: bookings, error: bookingsError },
    { data: slots, error: slotsError },
  ] = await Promise.all([
    loadPaidBackers(supabase, projectId),
    supabase
      .from("rewards")
      .select("id, title, amount, reward_type, needs_address")
      .eq("project_id", projectId),
    supabase
      .from("reward_schedule_participants")
      .select(PARTICIPANT_COLUMNS)
      .eq("schedule_id", scheduleId),
    supabase.from("reward_schedule_bookings").select(BOOKING_COLUMNS).eq("schedule_id", scheduleId),
    supabase.from("reward_schedule_slots").select(SLOT_COLUMNS).eq("schedule_id", scheduleId),
  ]);
  const error =
    backersError || rewardsError || participantsError || bookingsError || slotsError;
  if (error || !backers) {
    return { schedule: null, roster: [], backers: [], rewards: [], error };
  }

  const schedule: RewardSchedule = {
    ...(scheduleRow as Omit<RewardSchedule, "slots">),
    slots: sortSlots((slots || []) as RewardScheduleSlot[]),
  };
  const { roster } = buildRoster(
    schedule,
    backers,
    (rewards || []) as Reward[],
    (participants || []) as ParticipantRow[],
    (bookings || []) as BookingRow[]
  );
  return { schedule, roster, backers, rewards: (rewards || []) as Reward[], error: null };
}

type ScheduleFields = {
  title?: string;
  description?: string;
  location?: string;
  duration_minutes?: number | null;
  deadline?: string | null;
  status?: "open" | "closed";
  allow_other?: boolean;
  questions?: ScheduleQuestion[];
  excluded_emails?: string[];
};

const MAX_EXCLUDED = 2000;

/** 対象から外す人のメールアドレスを、保存できる形（小文字・重複なし）にそろえる */
function parseExcludedEmails(raw: unknown): { emails: string[]; error: string | null } {
  if (!Array.isArray(raw) || !raw.every((v) => typeof v === "string")) {
    return { emails: [], error: "対象から外す支援者の指定が正しくありません" };
  }
  const emails = [...new Set((raw as string[]).map(normalizeEmail).filter(Boolean))];
  if (emails.length > MAX_EXCLUDED) {
    return { emails: [], error: `対象から外せるのは${MAX_EXCLUDED}人までです` };
  }
  if (emails.some((e) => e.length > 320 || !e.includes("@"))) {
    return { emails: [], error: "対象から外す支援者の指定が正しくありません" };
  }
  return { emails, error: null };
}

/** 支援者に書いてもらう質問を検証して、保存できる形にそろえる */
function parseQuestions(raw: unknown): { questions: ScheduleQuestion[]; error: string | null } {
  if (!Array.isArray(raw)) return { questions: [], error: "質問の指定が正しくありません" };
  if (raw.length > 10) return { questions: [], error: "質問は10個までです" };
  const questions: ScheduleQuestion[] = [];
  for (const item of raw) {
    const q = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const label = typeof q.label === "string" ? q.label.trim() : "";
    const placeholder = typeof q.placeholder === "string" ? q.placeholder.trim() : "";
    if (!label) return { questions: [], error: "質問の内容を入力してください" };
    if (label.length > 100) return { questions: [], error: "質問は100文字以内で入力してください" };
    if (placeholder.length > 200) {
      return { questions: [], error: "質問の記入例は200文字以内で入力してください" };
    }
    // 編集しても回答とのひも付けが切れないよう、既存の質問は id を引き継ぐ
    const id =
      typeof q.id === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(q.id) ? q.id : randomUUID();
    if (questions.some((x) => x.id === id)) {
      return { questions: [], error: "質問の指定が正しくありません" };
    }
    questions.push({ id, label, placeholder, required: q.required === true });
  }
  return { questions, error: null };
}

/** 日程調整の入力を検証する。partial なら渡された項目だけ見る */
export function parseScheduleFields(
  body: Record<string, unknown>,
  partial: boolean
): { fields: ScheduleFields; error: string | null } {
  const fields: ScheduleFields = {};
  const has = (k: string) => k in body;

  if (!partial || has("title")) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return { fields, error: "タイトルを入力してください" };
    if (title.length > 100) return { fields, error: "タイトルは100文字以内で入力してください" };
    fields.title = title;
  }
  if (!partial || has("description")) {
    const v = typeof body.description === "string" ? body.description.trim() : "";
    if (v.length > 3000) return { fields, error: "案内文は3000文字以内で入力してください" };
    fields.description = v;
  }
  if (!partial || has("location")) {
    const v = typeof body.location === "string" ? body.location.trim() : "";
    if (v.length > 1000) return { fields, error: "場所・参加方法は1000文字以内で入力してください" };
    fields.location = v;
  }
  if (!partial || has("durationMinutes")) {
    const v = body.durationMinutes;
    if (v === null || v === undefined || v === "") {
      fields.duration_minutes = null;
    } else {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 5 || n > 1440) {
        return { fields, error: "所要時間は5〜1440分で入力してください" };
      }
      fields.duration_minutes = n;
    }
  }
  if (!partial || has("deadline")) {
    const v = body.deadline;
    if (v === null || v === undefined || v === "") {
      fields.deadline = null;
    } else {
      const iso = jstInputToIso(v);
      if (!iso) return { fields, error: "回答期限の日時が正しくありません" };
      fields.deadline = iso;
    }
  }
  if (has("status")) {
    if (body.status !== "open" && body.status !== "closed") {
      return { fields, error: "受付状態が正しくありません" };
    }
    fields.status = body.status;
  }
  if (!partial || has("allowOther")) {
    fields.allow_other = body.allowOther !== false;
  }
  if (!partial || has("questions")) {
    const { questions, error } = parseQuestions(body.questions ?? []);
    if (error) return { fields, error };
    fields.questions = questions;
  }
  if (has("excludedEmails")) {
    const { emails, error } = parseExcludedEmails(body.excludedEmails);
    if (error) return { fields, error };
    fields.excluded_emails = emails;
  }
  return { fields, error: null };
}

export type SlotInput = { starts_at: string; capacity: number; note: string; time_label: string };

export function parseSlot(
  raw: unknown,
  { partial = false }: { partial?: boolean } = {}
): { slot: Partial<SlotInput>; error: string | null } {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const slot: Partial<SlotInput> = {};
  if (!partial || "timeLabel" in body) {
    const label = typeof body.timeLabel === "string" ? body.timeLabel.trim() : "";
    if (label.length > 30) return { slot, error: "時間の表記は30文字以内で入力してください" };
    slot.time_label = label;
  }
  if (!partial || "startsAt" in body) {
    // 時間未定の枠は、日付だけ見てその日の終わりにそろえる
    const value =
      slot.time_label && typeof body.startsAt === "string"
        ? `${body.startsAt.slice(0, 10)}T${UNDECIDED_TIME}`
        : body.startsAt;
    const iso = jstInputToIso(value);
    if (!iso) return { slot, error: "日時が正しくありません" };
    slot.starts_at = iso;
  }
  if (!partial || "capacity" in body) {
    const n = body.capacity === undefined ? 1 : Number(body.capacity);
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      return { slot, error: "定員は1〜1000人で入力してください" };
    }
    slot.capacity = n;
  }
  if (!partial || "note" in body) {
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (note.length > 200) return { slot, error: "枠の補足は200文字以内で入力してください" };
    slot.note = note;
  }
  return { slot, error: null };
}

export const MAX_SLOTS_PER_SCHEDULE = 500;

/** 追加する枠をまとめて検証する（過去の日時は追加できない） */
export function parseSlots(raw: unknown): { slots: SlotInput[]; error: string | null } {
  const list = Array.isArray(raw) ? raw : [];
  if (list.length > MAX_SLOTS_PER_SCHEDULE) {
    return { slots: [], error: `1つの日程調整に作れる枠は${MAX_SLOTS_PER_SCHEDULE}枠までです` };
  }
  const slots: SlotInput[] = [];
  for (const item of list) {
    const { slot, error } = parseSlot(item);
    if (error) return { slots: [], error };
    slots.push(slot as SlotInput);
  }
  if (slots.some((s) => new Date(s.starts_at).getTime() < Date.now())) {
    return { slots: [], error: "過去の日時は追加できません" };
  }
  return { slots, error: null };
}
