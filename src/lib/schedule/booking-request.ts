import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BOOKING_ERRORS,
  loadBookingContext,
  MAX_PREFERENCES,
  submitPreferences,
  toBookingView,
  UUID_RE,
} from "./server";

type Ctx = NonNullable<Awaited<ReturnType<typeof loadBookingContext>>>;

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

/**
 * 支援者が日程の希望を回答する POST の共通処理。
 * body: {
 *   preferredSlotIds: string[]  // 第1希望から順に、最大3つ
 *   otherText?: string          // その他（自由記入）
 *   answers?: Record<string, string>  // 掲載者の質問への回答
 *   message?: string
 * }
 */
export async function handleBookingPost(
  req: Request,
  service: SupabaseClient,
  ctx: Ctx,
  pageUrl: string,
  reload: () => Promise<Ctx | null>
) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { schedule } = ctx;

  const raw = Array.isArray(body.preferredSlotIds) ? body.preferredSlotIds : null;
  if (!raw || !raw.every((v) => typeof v === "string" && UUID_RE.test(v))) {
    return bad("希望の日程が正しくありません");
  }
  const preferredSlotIds = [...new Set(raw as string[])];
  if (preferredSlotIds.length > MAX_PREFERENCES) {
    return bad(`希望の日程は第${MAX_PREFERENCES}希望までです`);
  }

  const otherText = typeof body.otherText === "string" ? body.otherText.trim() : "";
  if (otherText.length > 1000) return bad("「その他」は1000文字以内で入力してください");

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length > 500) return bad("掲載者へのメッセージは500文字以内で入力してください");

  const rawAnswers =
    body.answers && typeof body.answers === "object" ? (body.answers as Record<string, unknown>) : {};
  const answers: Record<string, string> = {};
  for (const q of schedule.questions ?? []) {
    const v = typeof rawAnswers[q.id] === "string" ? (rawAnswers[q.id] as string).trim() : "";
    if (q.required && !v) return bad(`「${q.label}」を入力してください`);
    if (v.length > 1000) return bad(`「${q.label}」は1000文字以内で入力してください`);
    if (v) answers[q.id] = v;
  }

  const hasChoices = ctx.slots.length > 0 || schedule.allow_other;
  if (hasChoices && preferredSlotIds.length === 0 && !(schedule.allow_other && otherText)) {
    return bad(
      schedule.allow_other
        ? "希望の日程を選ぶか、「その他」にご希望をご記入ください"
        : "希望の日程を選んでください"
    );
  }

  try {
    const { result } = await submitPreferences(service, ctx, {
      preferredSlotIds,
      otherText,
      answers,
      message,
      pageUrl,
    });
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
      { error: "回答を保存できませんでした。時間をおいて再度お試しください" },
      { status: 500 }
    );
  }

  const latest = await reload();
  return NextResponse.json({ view: latest ? toBookingView(latest) : null });
}
