import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { badRequest, loadManagedProject, loadScheduleRoster } from "@/lib/schedule/manage";
import {
  BOOKING_ERRORS,
  confirmBookings,
  getServiceSupabase,
  UUID_RE,
} from "@/lib/schedule/server";

type Params = { params: Promise<{ id: string; scheduleId: string; participantId: string }> };

/**
 * 掲載者が支援者1人の日程を確定する（確定済みの枠をまとめて置き換える）。
 * body: { slotIds: string[] }（空なら確定を取り消す）
 * 支援者へのお知らせは、まとめて「確定のお知らせを送る」で送る。
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, scheduleId, participantId } = await params;
  const { supabase, denied } = await loadManagedProject(id);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const raw = Array.isArray(body.slotIds) ? body.slotIds : null;
  if (!raw || raw.length > 100 || !raw.every((v) => typeof v === "string" && UUID_RE.test(v))) {
    return badRequest("確定する日程が正しくありません");
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: "サーバーの設定が不足しています" }, { status: 503 });
  }

  const { schedule, roster, error } = await loadScheduleRoster(supabase, id, scheduleId);
  if (error) return dbError(error);
  const entry = roster.find((r) => r.participantId === participantId);
  if (!schedule || !entry) {
    return NextResponse.json({ error: "対象者が見つかりません" }, { status: 404 });
  }
  if (entry.excluded && raw.length > 0) {
    return badRequest("対象から外した人の日程は確定できません。対象に戻してから確定してください");
  }

  try {
    const result = await confirmBookings(
      service,
      participantId,
      [...new Set(raw as string[])],
      entry.tickets
    );
    if (result !== "ok") {
      const e = BOOKING_ERRORS[result] ?? BOOKING_ERRORS.not_found;
      const message =
        result === "full"
          ? "その枠は定員に達しています。定員を増やすか、別の枠を選んでください"
          : result === "too_many"
            ? entry.tickets > 0
              ? `この方は${entry.tickets}枠まで確定できます`
              : "この方はいま対象のご支援がないため、日程を確定できません"
            : e.error;
      return NextResponse.json({ error: message }, { status: e.status });
    }
  } catch (err) {
    console.error("[schedule-confirm]", err);
    return NextResponse.json({ error: "日程を確定できませんでした" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
