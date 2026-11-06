import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { collectDigitalRecipients } from "@/lib/project/digital-delivery";
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
  "id, schedule_id, email, name, backer_ids, invited_at, slot_id, booked_at, message";

export interface ParticipantRow {
  id: string;
  schedule_id: string;
  email: string;
  name: string;
  backer_ids: string[];
  invited_at: string | null;
  slot_id: string | null;
  booked_at: string | null;
  message: string;
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
  schedule: Pick<RewardSchedule, "reward_id">,
  backers: readonly Backer[],
  rewards: readonly Reward[],
  participants: readonly ParticipantRow[]
): { roster: ScheduleRosterEntry[]; missingEmailCount: number } {
  const { recipients, missingEmailCount } = collectDigitalRecipients(
    backers,
    rewards,
    schedule.reward_id,
    []
  );
  const byEmail = new Map(participants.map((p) => [p.email, p]));

  const roster: ScheduleRosterEntry[] = recipients.map((r) => {
    const p = byEmail.get(r.email);
    byEmail.delete(r.email);
    return {
      email: r.email,
      name: r.name || p?.name || "",
      backerCount: r.backerIds.length,
      participantId: p?.id ?? null,
      invitedAt: p?.invited_at ?? null,
      slotId: p?.slot_id ?? null,
      bookedAt: p?.booked_at ?? null,
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
      slotId: p.slot_id,
      bookedAt: p.booked_at,
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
  const [schedulesRes, slotsRes, participantsRes] = await Promise.all([
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
  ]);
  const error = schedulesRes.error || slotsRes.error || participantsRes.error;
  if (error) return { schedules: null, error };

  const slots = (slotsRes.data || []) as RewardScheduleSlot[];
  const participants = (participantsRes.data || []) as ParticipantRow[];

  const schedules = (schedulesRes.data || []).map((s) => {
    const schedule = { ...(s as Omit<RewardSchedule, "slots">), slots: [] as RewardScheduleSlot[] };
    schedule.slots = sortSlots(slots.filter((slot) => slot.schedule_id === s.id));
    const { roster, missingEmailCount } = buildRoster(
      schedule,
      backers,
      rewards,
      participants.filter((p) => p.schedule_id === s.id)
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
  project: { id: string; title: string; slug: string | null };
  rewardTitle: string;
};

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

  const [slotsRes, takenRes, projectRes, rewardRes] = await Promise.all([
    service.from("reward_schedule_slots").select(SLOT_COLUMNS).eq("schedule_id", schedule.id),
    service
      .from("reward_schedule_participants")
      .select("slot_id")
      .eq("schedule_id", schedule.id)
      .not("slot_id", "is", null),
    service.from("projects").select("id, title, slug").eq("id", schedule.project_id).maybeSingle(),
    service.from("rewards").select("title").eq("id", schedule.reward_id).maybeSingle(),
  ]);
  if (!projectRes.data) return null;

  const takenBySlot = new Map<string, number>();
  for (const row of takenRes.data || []) {
    if (row.slot_id) takenBySlot.set(row.slot_id, (takenBySlot.get(row.slot_id) ?? 0) + 1);
  }

  return {
    participant: participant as ParticipantRow,
    schedule: schedule as Omit<RewardSchedule, "slots">,
    slots: sortSlots((slotsRes.data || []) as RewardScheduleSlot[]),
    takenBySlot,
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
  return {
    project: {
      title: ctx.project.title,
      path: `/projects/${ctx.project.slug || ctx.project.id}`,
    },
    rewardTitle: ctx.rewardTitle,
    schedule: {
      title: schedule.title,
      description: schedule.description,
      location: participant.slot_id ? schedule.location : null,
      durationMinutes: schedule.duration_minutes,
      deadline: schedule.deadline,
      status: schedule.status,
    },
    slots: ctx.slots.map((s) => ({
      id: s.id,
      startsAt: s.starts_at,
      note: s.note,
      remaining: Math.max(
        0,
        s.capacity - (ctx.takenBySlot.get(s.id) ?? 0) + (participant.slot_id === s.id ? 1 : 0)
      ),
      isPast: new Date(s.starts_at).getTime() < now,
    })),
    name: participant.name,
    slotId: participant.slot_id,
    message: participant.message,
    canChange: isScheduleChangeable(schedule),
  };
}

export const BOOKING_ERRORS: Record<string, { status: number; error: string }> = {
  not_found: { status: 404, error: "選んだ日程が見つかりません。画面を読み込み直してください" },
  closed: { status: 409, error: "この日程調整の受付は終了しました" },
  deadline: { status: 409, error: "回答期限を過ぎたため、日程を変更できません" },
  full: { status: 409, error: "その日程は満席になりました。別の日程をお選びください" },
  past: { status: 409, error: "その日程はすでに過ぎています" },
};

/**
 * 枠を予約・変更・取り消しし、本人へ控えのメールを送る。
 * message は掲載者への一言（予約と一緒に保存する）。
 */
export async function bookSlot(
  service: SupabaseClient,
  ctx: BookingContext,
  input: { slotId: string | null; message: string; force?: boolean; pageUrl: string }
): Promise<{ result: string }> {
  const { data: result, error } = await service.rpc("book_reward_schedule_slot", {
    p_participant: ctx.participant.id,
    p_slot: input.slotId,
    p_force: input.force ?? false,
  });
  if (error) throw error;
  if (result !== "ok") return { result: result as string };

  if (input.message !== ctx.participant.message) {
    await service
      .from("reward_schedule_participants")
      .update({ message: input.message })
      .eq("id", ctx.participant.id);
  }

  if (input.slotId !== ctx.participant.slot_id) {
    const slot = ctx.slots.find((s) => s.id === input.slotId) ?? null;
    await sendScheduleConfirmation({
      to: ctx.participant.email,
      nickname: ctx.participant.name || null,
      projectTitle: ctx.project.title,
      scheduleTitle: ctx.schedule.title,
      startsAt: slot?.starts_at ?? null,
      durationMinutes: ctx.schedule.duration_minutes,
      slotNote: slot?.note ?? "",
      location: ctx.schedule.location,
      url: input.pageUrl,
    });
  }

  return { result: "ok" };
}
