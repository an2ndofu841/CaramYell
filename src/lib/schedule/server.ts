import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { collectDigitalRecipients, normalizeEmail } from "@/lib/project/digital-delivery";
import { sendScheduleReceipt } from "@/lib/email/reward-schedule";
import type {
  Backer,
  Reward,
  RewardSchedule,
  RewardScheduleSlot,
  RewardScheduleWithRoster,
  ScheduleBookingView,
  ScheduleRosterEntry,
} from "@/types";

export const SCHEDULE_COLUMNS =
  "id, project_id, reward_id, title, description, location, duration_minutes, deadline, status, allow_other, questions, excluded_emails, created_at, updated_at";
export const SLOT_COLUMNS = "id, schedule_id, starts_at, capacity, note, time_label";
export const PARTICIPANT_COLUMNS =
  "id, schedule_id, project_id, email, name, backer_ids, invited_at, message, preferred_slot_ids, other_text, answers, submitted_at, notified_slot_ids, notified_at";
export const BOOKING_COLUMNS = "participant_id, schedule_id, slot_id, booked_at";

/** 支援者が選べる希望の数（第1〜第3希望） */
export const MAX_PREFERENCES = 3;

export interface ParticipantRow {
  id: string;
  schedule_id: string;
  email: string;
  name: string;
  backer_ids: string[];
  invited_at: string | null;
  message: string;
  preferred_slot_ids: string[];
  other_text: string;
  answers: Record<string, string>;
  submitted_at: string | null;
  notified_slot_ids: string[];
  notified_at: string | null;
}

export interface BookingRow {
  participant_id: string;
  schedule_id: string;
  slot_id: string;
  booked_at: string;
}

/** 参加者ごとの確定済みの枠（開始が早い順） */
function slotIdsByParticipant(
  bookings: readonly BookingRow[],
  slots: readonly RewardScheduleSlot[]
): Map<string, string[]> {
  const startOf = new Map(slots.map((s) => [s.id, s.starts_at]));
  const map = new Map<string, string[]>();
  for (const b of bookings) {
    map.set(b.participant_id, [...(map.get(b.participant_id) ?? []), b.slot_id]);
  }
  for (const ids of map.values()) {
    ids.sort((a, b) => (startOf.get(a) ?? "").localeCompare(startOf.get(b) ?? ""));
  }
  return map;
}

/** 消えた枠を希望から外す（並び順はそのまま） */
const livePreferences = (ids: readonly string[] | null, slots: readonly RewardScheduleSlot[]) =>
  (ids ?? []).filter((id) => slots.some((s) => s.id === id));

export const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false } });
}

export const sortSlots = (slots: RewardScheduleSlot[]) =>
  [...slots].sort((a, b) => a.starts_at.localeCompare(b.starts_at));

/**
 * 日程調整の対象者一覧。リターンを受け取る支援者（上位プラン含む）をメールアドレス単位で集め、
 * 案内・回答・確定の状況を重ねる。案内後に返金された人も、回答が残っていれば見えるように残す。
 * 掲載者が外した人は、戻せるように excluded として残す（対象には数えない）。
 */
export function buildRoster(
  schedule: Pick<RewardSchedule, "reward_id" | "slots" | "excluded_emails">,
  backers: readonly Backer[],
  rewards: readonly Reward[],
  participants: readonly ParticipantRow[],
  bookings: readonly BookingRow[]
): { roster: ScheduleRosterEntry[]; missingEmailCount: number } {
  const { recipients, missingEmailCount } = collectDigitalRecipients(
    backers,
    rewards,
    schedule.reward_id,
    []
  );
  const byEmail = new Map(participants.map((p) => [p.email, p]));
  const booked = slotIdsByParticipant(bookings, schedule.slots);
  const excluded = new Set(schedule.excluded_emails ?? []);

  const fromParticipant = (p: ParticipantRow | undefined) => {
    const slotIds = p ? booked.get(p.id) ?? [] : [];
    return {
      participantId: p?.id ?? null,
      invitedAt: p?.invited_at ?? null,
      submittedAt: p?.submitted_at ?? null,
      preferredSlotIds: p ? livePreferences(p.preferred_slot_ids, schedule.slots) : [],
      otherText: p?.other_text ?? "",
      answers: p?.answers ?? {},
      slotIds,
      // 知らせた枠が消された場合も「取り消しのお知らせ」が要るので、消えた枠も含めて比べる
      needsNotice: p ? !sameSet(slotIds, p.notified_slot_ids ?? []) : false,
      message: p?.message ?? "",
    };
  };

  const roster: ScheduleRosterEntry[] = recipients.map((r) => {
    const p = byEmail.get(r.email);
    byEmail.delete(r.email);
    return {
      email: r.email,
      name: r.name || p?.name || "",
      backerCount: r.backerIds.length,
      tickets: r.quantity,
      eligible: !excluded.has(r.email),
      excluded: excluded.has(r.email),
      ...fromParticipant(p),
    };
  });

  for (const p of byEmail.values()) {
    roster.push({
      email: p.email,
      name: p.name,
      backerCount: p.backer_ids.length,
      tickets: 0,
      eligible: false,
      excluded: excluded.has(p.email),
      ...fromParticipant(p),
    });
  }

  return { roster, missingEmailCount };
}

/** 掲載者画面用に、プロジェクトの日程調整を枠・対象者つきで読む（呼び出し側で権限確認済み） */
export async function loadSchedulesWithRoster(
  supabase: SupabaseClient,
  projectId: string,
  backers: readonly Backer[],
  rewards: readonly Reward[]
): Promise<{ schedules: RewardScheduleWithRoster[] | null; error: unknown }> {
  const [schedulesRes, slotsRes, participantsRes, bookingsRes] = await Promise.all([
    supabase
      .from("reward_schedules")
      .select(SCHEDULE_COLUMNS)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase.from("reward_schedule_slots").select(SLOT_COLUMNS).eq("project_id", projectId),
    supabase
      .from("reward_schedule_participants")
      .select(PARTICIPANT_COLUMNS)
      .eq("project_id", projectId),
    supabase.from("reward_schedule_bookings").select(BOOKING_COLUMNS).eq("project_id", projectId),
  ]);
  const error =
    schedulesRes.error || slotsRes.error || participantsRes.error || bookingsRes.error;
  if (error) return { schedules: null, error };

  const slots = (slotsRes.data || []) as RewardScheduleSlot[];
  const participants = (participantsRes.data || []) as ParticipantRow[];
  const bookings = (bookingsRes.data || []) as BookingRow[];

  const schedules = (schedulesRes.data || []).map((s) => {
    const schedule = { ...(s as Omit<RewardSchedule, "slots">), slots: [] as RewardScheduleSlot[] };
    schedule.slots = sortSlots(slots.filter((slot) => slot.schedule_id === s.id));
    const { roster, missingEmailCount } = buildRoster(
      schedule,
      backers,
      rewards,
      participants.filter((p) => p.schedule_id === s.id),
      bookings.filter((b) => b.schedule_id === s.id)
    );
    return { ...schedule, roster, missingEmailCount };
  });

  return { schedules, error: null };
}

type BookingContext = {
  participant: ParticipantRow;
  schedule: Omit<RewardSchedule, "slots">;
  slots: RewardScheduleSlot[];
  takenBySlot: Map<string, number>;
  /** この人の確定済みの枠（開始が早い順） */
  mySlotIds: string[];
  /** 確定する枠数（いまの支援口数） */
  tickets: number;
  /** 掲載者がこの日程調整の対象から外した */
  excluded: boolean;
  project: { id: string; title: string; slug: string | null };
  rewardTitle: string;
};

/**
 * ある人がこのリターンを何口受け取るか。案内の後に追加で支援したり返金されたりするので、
 * 回答・確定のたびに支援データから数え直す。
 */
export async function countTickets(
  service: SupabaseClient,
  projectId: string,
  rewardId: string,
  email: string
): Promise<number> {
  const [{ data: backers }, { data: rewards }] = await Promise.all([
    service
      .from("backers")
      .select(
        `
        id, reward_id, guest_email, guest_nickname, amount, status, created_at,
        rewards(id, title, reward_type),
        backer_items(id, reward_id, reward_title, unit_amount, quantity, needs_address)
      `
      )
      .eq("project_id", projectId)
      .eq("status", "paid")
      .ilike("guest_email", email),
    service
      .from("rewards")
      .select("id, title, amount, reward_type, needs_address")
      .eq("project_id", projectId),
  ]);
  // ilike は _ や % を任意の文字として扱うので、最後に完全一致で絞る
  const own = ((backers || []) as unknown as Backer[]).filter(
    (b) => normalizeEmail(b.guest_email || "") === email
  );
  const { recipients } = collectDigitalRecipients(own, (rewards || []) as Reward[], rewardId, []);
  return recipients[0]?.quantity ?? 0;
}

/** 支援者1人分の回答画面に必要なものを service_role で読む */
export async function loadBookingContext(
  service: SupabaseClient,
  where: { tokenHash: string } | { participantId: string }
): Promise<BookingContext | null> {
  let query = service.from("reward_schedule_participants").select(PARTICIPANT_COLUMNS);
  query =
    "tokenHash" in where
      ? query.eq("token_hash", where.tokenHash)
      : query.eq("id", where.participantId);
  const { data: participant } = await query.maybeSingle();
  if (!participant) return null;

  const { data: schedule } = await service
    .from("reward_schedules")
    .select(SCHEDULE_COLUMNS)
    .eq("id", participant.schedule_id)
    .maybeSingle();
  if (!schedule) return null;

  const [slotsRes, bookingsRes, projectRes, rewardRes, tickets] = await Promise.all([
    service.from("reward_schedule_slots").select(SLOT_COLUMNS).eq("schedule_id", schedule.id),
    service.from("reward_schedule_bookings").select(BOOKING_COLUMNS).eq("schedule_id", schedule.id),
    service.from("projects").select("id, title, slug").eq("id", schedule.project_id).maybeSingle(),
    service.from("rewards").select("title").eq("id", schedule.reward_id).maybeSingle(),
    countTickets(service, schedule.project_id, schedule.reward_id, participant.email),
  ]);
  if (!projectRes.data) return null;

  const slots = sortSlots((slotsRes.data || []) as RewardScheduleSlot[]);
  const bookings = (bookingsRes.data || []) as BookingRow[];
  const excluded = ((schedule.excluded_emails ?? []) as string[]).includes(participant.email);
  const takenBySlot = new Map<string, number>();
  for (const b of bookings) takenBySlot.set(b.slot_id, (takenBySlot.get(b.slot_id) ?? 0) + 1);

  return {
    participant: participant as ParticipantRow,
    schedule: schedule as Omit<RewardSchedule, "slots">,
    slots,
    takenBySlot,
    mySlotIds:
      slotIdsByParticipant(
        bookings.filter((b) => b.participant_id === participant.id),
        slots
      ).get(participant.id) ?? [],
    // 外された人は回答できないよう、対象のご支援が無い扱いにする
    tickets: excluded ? 0 : tickets,
    excluded,
    project: projectRes.data,
    rewardTitle: rewardRes.data?.title ?? "",
  };
}

export function isScheduleChangeable(schedule: Pick<RewardSchedule, "status" | "deadline">) {
  if (schedule.status !== "open") return false;
  return !schedule.deadline || new Date(schedule.deadline).getTime() > Date.now();
}

/** 枠ごとの残り（確定した人数で数える。自分の確定ぶんは空きに戻す） */
function remainingOf(ctx: BookingContext, slot: RewardScheduleSlot) {
  const mine = ctx.mySlotIds.includes(slot.id) ? 1 : 0;
  return Math.max(0, slot.capacity - (ctx.takenBySlot.get(slot.id) ?? 0) + mine);
}

export function toBookingView(ctx: BookingContext): ScheduleBookingView {
  const { participant, schedule } = ctx;
  const now = Date.now();
  return {
    project: {
      title: ctx.project.title,
      path: `/projects/${ctx.project.slug || ctx.project.id}`,
    },
    rewardTitle: ctx.rewardTitle,
    schedule: {
      title: schedule.title,
      description: schedule.description,
      location: ctx.mySlotIds.length > 0 ? schedule.location : null,
      durationMinutes: schedule.duration_minutes,
      deadline: schedule.deadline,
      status: schedule.status,
      allowOther: schedule.allow_other,
      questions: schedule.questions ?? [],
    },
    slots: ctx.slots.map((s) => ({
      id: s.id,
      startsAt: s.starts_at,
      note: s.note,
      timeLabel: s.time_label ?? "",
      remaining: remainingOf(ctx, s),
      isPast: new Date(s.starts_at).getTime() < now,
    })),
    name: participant.name,
    tickets: ctx.tickets,
    submittedAt: participant.submitted_at,
    preferredSlotIds: livePreferences(participant.preferred_slot_ids, ctx.slots),
    otherText: participant.other_text,
    answers: participant.answers ?? {},
    slotIds: ctx.mySlotIds,
    message: participant.message,
    canChange: isScheduleChangeable(schedule),
    cancelled:
      Boolean(participant.notified_at) &&
      (participant.notified_slot_ids ?? []).length === 0 &&
      ctx.mySlotIds.length === 0 &&
      !participant.submitted_at,
    excluded: ctx.excluded,
  };
}

export const BOOKING_ERRORS: Record<string, { status: number; error: string }> = {
  not_found: { status: 404, error: "選んだ日程が見つかりません。画面を読み込み直してください" },
  closed: { status: 409, error: "この日程調整の受付は終了しました" },
  deadline: { status: 409, error: "回答期限を過ぎたため、回答を変更できません" },
  full: { status: 409, error: "選んだ日程の一部が満席になりました。別の日程をお選びください" },
  past: { status: 409, error: "その日程はすでに過ぎています" },
  too_many: { status: 409, error: "ご支援の口数より多くの日程は確定できません" },
  not_eligible: { status: 409, error: "このリターンの対象となるご支援が見つかりませんでした" },
  confirmed: {
    status: 409,
    error: "日程はすでに確定しています。変更が必要な場合は掲載者へご連絡ください",
  },
};

export type PreferenceInput = {
  preferredSlotIds: string[];
  otherText: string;
  answers: Record<string, string>;
  message: string;
};

/**
 * 支援者の回答（希望の日程・その他・質問への回答・メッセージ）を保存し、本人へ控えを送る。
 * 希望は枠を押さえないので、定員は「すでに確定で埋まった枠を新たに選べない」ことだけを見る。
 */
export async function submitPreferences(
  service: SupabaseClient,
  ctx: BookingContext,
  input: PreferenceInput & { pageUrl: string }
): Promise<{ result: string }> {
  const { schedule } = ctx;
  if (schedule.status !== "open") return { result: "closed" };
  if (schedule.deadline && new Date(schedule.deadline).getTime() < Date.now()) {
    return { result: "deadline" };
  }
  if (ctx.tickets <= 0) return { result: "not_eligible" };
  if (ctx.mySlotIds.length >= ctx.tickets) return { result: "confirmed" };

  const previous = ctx.participant.preferred_slot_ids ?? [];
  const now = Date.now();
  for (const id of input.preferredSlotIds) {
    const slot = ctx.slots.find((s) => s.id === id);
    if (!slot) return { result: "not_found" };
    if (previous.includes(id)) continue;
    if (new Date(slot.starts_at).getTime() < now) return { result: "past" };
    if (remainingOf(ctx, slot) <= 0) return { result: "full" };
  }

  const { error } = await service
    .from("reward_schedule_participants")
    .update({
      preferred_slot_ids: input.preferredSlotIds,
      other_text: schedule.allow_other ? input.otherText : "",
      answers: input.answers,
      message: input.message,
      submitted_at: ctx.participant.submitted_at ?? new Date().toISOString(),
    })
    .eq("id", ctx.participant.id);
  if (error) throw error;

  const labelOf = new Map((schedule.questions ?? []).map((q) => [q.id, q.label]));
  await sendScheduleReceipt({
    to: ctx.participant.email,
    nickname: ctx.participant.name || null,
    projectTitle: ctx.project.title,
    scheduleTitle: schedule.title,
    preferences: input.preferredSlotIds.map((id) => {
      const s = ctx.slots.find((x) => x.id === id)!;
      return { startsAt: s.starts_at, note: s.note, timeLabel: s.time_label ?? "" };
    }),
    otherText: schedule.allow_other ? input.otherText : "",
    answers: Object.entries(input.answers)
      .filter(([id, v]) => labelOf.has(id) && v)
      .map(([id, v]) => ({ label: labelOf.get(id)!, value: v })),
    durationMinutes: schedule.duration_minutes,
    url: input.pageUrl,
  });

  return { result: "ok" };
}

/**
 * 掲載者が日程を確定する（確定済みの枠をまとめて置き換える）。
 * 受付終了・締切後や過ぎた枠でも確定できるが、定員と口数は超えられない。
 */
export async function confirmBookings(
  service: SupabaseClient,
  participantId: string,
  slotIds: string[],
  tickets: number
): Promise<string> {
  const { data, error } = await service.rpc("set_reward_schedule_bookings", {
    p_participant: participantId,
    p_slots: slotIds,
    p_max: tickets,
    p_force: true,
  });
  if (error) throw error;
  return data as string;
}
