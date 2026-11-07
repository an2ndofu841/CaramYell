import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { collectDigitalRecipients, normalizeEmail } from "@/lib/project/digital-delivery";
import { sendScheduleConfirmation } from "@/lib/email/reward-schedule";
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
  "id, project_id, reward_id, title, description, location, duration_minutes, deadline, status, created_at, updated_at";
export const SLOT_COLUMNS = "id, schedule_id, starts_at, capacity, note";
export const PARTICIPANT_COLUMNS =
  "id, schedule_id, project_id, email, name, backer_ids, invited_at, message";
export const BOOKING_COLUMNS = "participant_id, schedule_id, slot_id, booked_at";

export interface ParticipantRow {
  id: string;
  schedule_id: string;
  email: string;
  name: string;
  backer_ids: string[];
  invited_at: string | null;
  message: string;
}

export interface BookingRow {
  participant_id: string;
  schedule_id: string;
  slot_id: string;
  booked_at: string;
}

/** 参加者ごとの予約済みの枠（開始が早い順） */
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
 * 案内・予約の状況を重ねる。案内後に返金された人も、予約が残っていれば見えるように残す。
 */
export function buildRoster(
  schedule: Pick<RewardSchedule, "reward_id" | "slots">,
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

  const roster: ScheduleRosterEntry[] = recipients.map((r) => {
    const p = byEmail.get(r.email);
    byEmail.delete(r.email);
    return {
      email: r.email,
      name: r.name || p?.name || "",
      backerCount: r.backerIds.length,
      participantId: p?.id ?? null,
      invitedAt: p?.invited_at ?? null,
      tickets: r.quantity,
      slotIds: p ? booked.get(p.id) ?? [] : [],
      message: p?.message ?? "",
      eligible: true,
    };
  });

  for (const p of byEmail.values()) {
    roster.push({
      email: p.email,
      name: p.name,
      backerCount: p.backer_ids.length,
      participantId: p.id,
      invitedAt: p.invited_at,
      tickets: 0,
      slotIds: booked.get(p.id) ?? [],
      message: p.message,
      eligible: false,
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
  /** この人が予約済みの枠（開始が早い順） */
  mySlotIds: string[];
  /** 予約できる枠数（いまの支援口数） */
  tickets: number;
  project: { id: string; title: string; slug: string | null };
  rewardTitle: string;
};

/**
 * ある人がこのリターンを何口受け取るか。案内の後に追加で支援したり返金されたりするので、
 * 予約のたびに支援データから数え直す。
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

/** 支援者1人分の予約画面に必要なものを service_role で読む */
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
    tickets,
    project: projectRes.data,
    rewardTitle: rewardRes.data?.title ?? "",
  };
}

export function isScheduleChangeable(schedule: Pick<RewardSchedule, "status" | "deadline">) {
  if (schedule.status !== "open") return false;
  return !schedule.deadline || new Date(schedule.deadline).getTime() > Date.now();
}

export function toBookingView(ctx: BookingContext): ScheduleBookingView {
  const { participant, schedule } = ctx;
  const now = Date.now();
  const mine = new Set(ctx.mySlotIds);
  return {
    project: {
      title: ctx.project.title,
      path: `/projects/${ctx.project.slug || ctx.project.id}`,
    },
    rewardTitle: ctx.rewardTitle,
    schedule: {
      title: schedule.title,
      description: schedule.description,
      location: mine.size > 0 ? schedule.location : null,
      durationMinutes: schedule.duration_minutes,
      deadline: schedule.deadline,
      status: schedule.status,
    },
    slots: ctx.slots.map((s) => ({
      id: s.id,
      startsAt: s.starts_at,
      note: s.note,
      // 自分の予約ぶんは「空き」に数える（選び直しても自分の席は残るため）
      remaining: Math.max(
        0,
        s.capacity - (ctx.takenBySlot.get(s.id) ?? 0) + (mine.has(s.id) ? 1 : 0)
      ),
      isPast: new Date(s.starts_at).getTime() < now,
    })),
    name: participant.name,
    tickets: ctx.tickets,
    slotIds: ctx.mySlotIds,
    message: participant.message,
    canChange: isScheduleChangeable(schedule),
  };
}

export const BOOKING_ERRORS: Record<string, { status: number; error: string }> = {
  not_found: { status: 404, error: "選んだ日程が見つかりません。画面を読み込み直してください" },
  closed: { status: 409, error: "この日程調整の受付は終了しました" },
  deadline: { status: 409, error: "回答期限を過ぎたため、日程を変更できません" },
  full: { status: 409, error: "選んだ日程の一部が満席になりました。別の日程をお選びください" },
  past: { status: 409, error: "その日程はすでに過ぎています" },
  too_many: { status: 409, error: "ご支援の口数より多くの日程は選べません" },
};

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

/**
 * 予約をまとめて置き換え（選ぶ・変える・取り消す）、変わったら本人へ控えのメールを送る。
 * message は掲載者への一言（予約と一緒に保存する）。
 */
export async function setBookings(
  service: SupabaseClient,
  ctx: BookingContext,
  input: { slotIds: string[]; message: string; pageUrl: string }
): Promise<{ result: string }> {
  const { data: result, error } = await service.rpc("set_reward_schedule_bookings", {
    p_participant: ctx.participant.id,
    p_slots: input.slotIds,
    p_max: ctx.tickets,
    p_force: false,
  });
  if (error) throw error;
  if (result !== "ok") return { result: result as string };

  if (input.message !== ctx.participant.message) {
    await service
      .from("reward_schedule_participants")
      .update({ message: input.message })
      .eq("id", ctx.participant.id);
  }

  if (!sameSet(input.slotIds, ctx.mySlotIds)) {
    const chosen = ctx.slots.filter((s) => input.slotIds.includes(s.id));
    await sendScheduleConfirmation({
      to: ctx.participant.email,
      nickname: ctx.participant.name || null,
      projectTitle: ctx.project.title,
      scheduleTitle: ctx.schedule.title,
      slots: chosen.map((s) => ({ startsAt: s.starts_at, note: s.note })),
      tickets: ctx.tickets,
      durationMinutes: ctx.schedule.duration_minutes,
      location: ctx.schedule.location,
      url: input.pageUrl,
    });
  }

  return { result: "ok" };
}
