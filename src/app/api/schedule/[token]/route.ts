import { NextRequest, NextResponse } from "next/server";
import { schedulePageUrl } from "@/lib/email/reward-schedule";
import { hashInviteToken, isInviteToken } from "@/lib/organization/invite-token";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { handleBookingPost } from "@/lib/schedule/booking-request";
import { getServiceSupabase, loadBookingContext, toBookingView } from "@/lib/schedule/server";

/**
 * 支援者がメールのリンクから日程を選ぶ（ログイン不要）。
 * リンクのトークンで本人を確かめ、読み書きはサーバーが service_role で行う。
 */

const notFound = () =>
  NextResponse.json(
    { error: "リンクが無効です。最新の案内メールのリンクからお試しください" },
    { status: 404 }
  );

async function load(token: string) {
  if (!isInviteToken(token)) return { service: null, ctx: null };
  const service = getServiceSupabase();
  if (!service) return { service: null, ctx: null };
  const ctx = await loadBookingContext(service, { tokenHash: hashInviteToken(token) });
  return { service, ctx };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const limit = rateLimit(clientKey(req, "schedule-view"), 60, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const { token } = await params;
  const { ctx } = await load(token);
  if (!ctx) return notFound();
  return NextResponse.json({ view: toBookingView(ctx) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const limit = rateLimit(clientKey(req, "schedule-book"), 20, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const { token } = await params;
  const { service, ctx } = await load(token);
  if (!service || !ctx) return notFound();

  return handleBookingPost(req, service, ctx, schedulePageUrl(token), () =>
    loadBookingContext(service, { tokenHash: hashInviteToken(token) })
  );
}
