import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config/site";
import { handleBookingPost } from "@/lib/schedule/booking-request";
import { loadOwnBookingContext } from "@/lib/schedule/account";
import { loadBookingContext, toBookingView } from "@/lib/schedule/server";

/** マイページから日程を選ぶ（ログイン中の支援者本人のみ） */

type Params = { params: Promise<{ participantId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { participantId } = await params;
  const { user, ctx } = await loadOwnBookingContext(participantId);
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  if (!ctx) return NextResponse.json({ error: "日程調整が見つかりません" }, { status: 404 });
  return NextResponse.json({ view: toBookingView(ctx) });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { participantId } = await params;
  const { user, service, ctx } = await loadOwnBookingContext(participantId);
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  if (!service || !ctx) {
    return NextResponse.json({ error: "日程調整が見つかりません" }, { status: 404 });
  }
  return handleBookingPost(
    req,
    service,
    ctx,
    `${SITE_URL}/dashboard/schedules/${participantId}`,
    () => loadBookingContext(service, { participantId })
  );
}
