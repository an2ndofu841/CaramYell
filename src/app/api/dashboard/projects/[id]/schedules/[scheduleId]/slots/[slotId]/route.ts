import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { badRequest, loadManagedProject, parseSlot } from "@/lib/schedule/manage";
import { SLOT_COLUMNS } from "@/lib/schedule/server";

type Params = { params: Promise<{ id: string; scheduleId: string; slotId: string }> };

/** 枠の日時・定員・補足を変える。定員を予約数未満にはできない（DB のトリガーで拒否） */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, scheduleId, slotId } = await params;
  const { supabase, denied } = await loadManagedProject(id);
  if (denied) return denied;

  const { slot, error: inputError } = parseSlot(await req.json().catch(() => ({})), {
    partial: true,
  });
  if (inputError) return badRequest(inputError);
  if (Object.keys(slot).length === 0) return badRequest("変更する項目がありません");

  const { data, error } = await supabase
    .from("reward_schedule_slots")
    .update(slot)
    .eq("id", slotId)
    .eq("schedule_id", scheduleId)
    .eq("project_id", id)
    .select(SLOT_COLUMNS)
    .maybeSingle();
  if (error) return dbError(error);
  if (!data) return NextResponse.json({ error: "枠が見つかりません" }, { status: 404 });
  return NextResponse.json({ slot: data });
}

/**
 * 枠を削除する。予約が入っている枠は ?force=1 のときだけ消せる
 * （予約していた人は「未回答」に戻る）。
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, scheduleId, slotId } = await params;
  const { supabase, denied } = await loadManagedProject(id);
  if (denied) return denied;

  const force = req.nextUrl.searchParams.get("force") === "1";
  if (!force) {
    const { count } = await supabase
      .from("reward_schedule_participants")
      .select("id", { count: "exact", head: true })
      .eq("slot_id", slotId);
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: `この枠には${count}人の予約があります`, bookedCount: count },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from("reward_schedule_slots")
    .delete()
    .eq("id", slotId)
    .eq("schedule_id", scheduleId)
    .eq("project_id", id)
    .select("id");
  if (error) return dbError(error);
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "枠が見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
