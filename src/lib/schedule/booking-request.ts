import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BOOKING_ERRORS,
  setBookings,
  loadBookingContext,
  toBookingView,
  UUID_RE,
} from "./server";

type Ctx = NonNullable<Awaited<ReturnType<typeof loadBookingContext>>>;

/**
 * 支援者が枠を選ぶ・変える・取り消す POST の共通処理。
 * body: { slotIds: string[], message?: string }（空の配列なら全部取り消し）
 */
export async function handleBookingPost(
  req: Request,
  service: SupabaseClient,
  ctx: Ctx,
  pageUrl: string,
  reload: () => Promise<Ctx | null>
) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const raw = Array.isArray(body.slotIds) ? body.slotIds : null;
  if (!raw || raw.length > 100 || !raw.every((v) => typeof v === "string" && UUID_RE.test(v))) {
    return NextResponse.json({ error: "日程を選んでください" }, { status: 400 });
  }
  const slotIds = [...new Set(raw as string[])];
  const message =
    typeof body.message === "string" ? body.message.trim() : ctx.participant.message;
  if (message.length > 500) {
    return NextResponse.json(
      { error: "掲載者へのメッセージは500文字以内で入力してください" },
      { status: 400 }
    );
  }

  try {
    const { result } = await setBookings(service, ctx, { slotIds, message, pageUrl });
    if (result !== "ok") {
      const e = BOOKING_ERRORS[result] ?? BOOKING_ERRORS.not_found;
      const latest = await reload();
      return NextResponse.json(
        { error: e.error, view: latest ? toBookingView(latest) : null },
        { status: e.status }
      );
    }
  } catch (err) {
    console.error("[schedule-booking]", err);
    return NextResponse.json(
      { error: "日程を保存できませんでした。時間をおいて再度お試しください" },
      { status: 500 }
    );
  }

  const latest = await reload();
  return NextResponse.json({ view: latest ? toBookingView(latest) : null });
}
