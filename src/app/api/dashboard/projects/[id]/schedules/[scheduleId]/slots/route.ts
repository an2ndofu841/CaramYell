import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { badRequest, loadManagedProject, parseSlot, type SlotInput } from "@/lib/schedule/manage";
import { SLOT_COLUMNS } from "@/lib/schedule/server";

const MAX_SLOTS_PER_REQUEST = 100;
const MAX_SLOTS_PER_SCHEDULE = 500;

/** 候補の枠をまとめて追加する。body: { slots: [{ startsAt, capacity, note }] } */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const { id, scheduleId } = await params;
  const { supabase, denied } = await loadManagedProject(id);
  if (denied) return denied;

  const { data: schedule } = await supabase
    .from("reward_schedules")
    .select("id")
    .eq("id", scheduleId)
    .eq("project_id", id)
    .maybeSingle();
  if (!schedule) return NextResponse.json({ error: "日程調整が見つかりません" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { slots?: unknown };
  const raw = Array.isArray(body.slots) ? body.slots : [];
  if (raw.length === 0) return badRequest("追加する日時を入力してください");
  if (raw.length > MAX_SLOTS_PER_REQUEST) {
    return badRequest(`一度に追加できるのは${MAX_SLOTS_PER_REQUEST}枠までです`);
  }

  const slots: SlotInput[] = [];
  for (const item of raw) {
    const { slot, error } = parseSlot(item);
    if (error) return badRequest(error);
    slots.push(slot as SlotInput);
  }
  if (slots.some((s) => new Date(s.starts_at).getTime() < Date.now())) {
    return badRequest("過去の日時は追加できません");
  }

  const { count } = await supabase
    .from("reward_schedule_slots")
    .select("id", { count: "exact", head: true })
    .eq("schedule_id", scheduleId);
  if ((count ?? 0) + slots.length > MAX_SLOTS_PER_SCHEDULE) {
    return badRequest(`1つの日程調整に作れる枠は${MAX_SLOTS_PER_SCHEDULE}枠までです`);
  }

  const { data, error } = await supabase
    .from("reward_schedule_slots")
    .insert(slots.map((s) => ({ ...s, schedule_id: scheduleId, project_id: id })))
    .select(SLOT_COLUMNS);
  if (error) return dbError(error);

  return NextResponse.json({ slots: data || [] }, { status: 201 });
}
