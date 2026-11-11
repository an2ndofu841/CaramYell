import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import {
  badRequest,
  loadManagedProject,
  loadScheduleRoster,
  parseScheduleFields,
} from "@/lib/schedule/manage";
import { SCHEDULE_COLUMNS } from "@/lib/schedule/server";

type Params = { params: Promise<{ id: string; scheduleId: string }> };

/** 日程調整の内容・受付状態を変える */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, scheduleId } = await params;
  const { supabase, denied } = await loadManagedProject(id);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { fields, error: inputError } = parseScheduleFields(body, true);
  if (inputError) return badRequest(inputError);
  if (Object.keys(fields).length === 0) return badRequest("変更する項目がありません");

  if (fields.excluded_emails) {
    const { schedule, roster, error: loadError } = await loadScheduleRoster(supabase, id, scheduleId);
    if (loadError) return dbError(loadError);
    if (!schedule) return NextResponse.json({ error: "日程調整が見つかりません" }, { status: 404 });
    const excluding = new Set(fields.excluded_emails);
    const booked = roster.find(
      (r) => excluding.has(r.email) && !r.excluded && r.slotIds.length > 0
    );
    if (booked) {
      return badRequest(
        `${booked.name || booked.email} さんは日程を確定しています。確定を外してから対象から外してください`
      );
    }
  }

  const { data, error } = await supabase
    .from("reward_schedules")
    .update(fields)
    .eq("id", scheduleId)
    .eq("project_id", id)
    .select(SCHEDULE_COLUMNS)
    .maybeSingle();
  if (error) return dbError(error);
  if (!data) return NextResponse.json({ error: "日程調整が見つかりません" }, { status: 404 });

  return NextResponse.json({ schedule: data });
}

/** 日程調整を削除する（枠・回答・確定もまとめて消える） */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, scheduleId } = await params;
  const { supabase, denied } = await loadManagedProject(id);
  if (denied) return denied;

  const { data, error } = await supabase
    .from("reward_schedules")
    .delete()
    .eq("id", scheduleId)
    .eq("project_id", id)
    .select("id");
  if (error) return dbError(error);
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "日程調整が見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
