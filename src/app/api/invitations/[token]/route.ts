import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";
import { hashInviteToken, isInviteToken } from "@/lib/organization/invite-token";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const notFound = () =>
  NextResponse.json({ error: "招待が見つかりません。リンクをご確認ください" }, { status: 404 });

/** 招待リンクを開いた人に、どの事務所からの招待かを返す */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const limited = rateLimit(clientKey(req, "invitation-lookup"), 30, 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);
  if (!isInviteToken(token)) return notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_organization_invitation", {
    p_token_hash: hashInviteToken(token),
  });
  if (error) return dbError(error);

  const invitation = Array.isArray(data) ? data[0] : data;
  if (!invitation) return notFound();

  return NextResponse.json({
    invitation: {
      organizationName: invitation.organization_name as string,
      email: invitation.email as string,
      role: invitation.role as string,
      expiresAt: invitation.expires_at as string,
      accepted: invitation.accepted as boolean,
      expired: new Date(invitation.expires_at).getTime() < Date.now(),
    },
  });
}

/** 招待を受けて事務所のメンバーになる */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const limited = rateLimit(clientKey(req, "invitation-accept"), 10, 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);
  if (!isInviteToken(token)) return notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  // メールアドレスの照合・期限・重複所属の確認は DB 側で行う
  const { data, error } = await supabase.rpc("accept_organization_invitation", {
    p_token_hash: hashInviteToken(token),
  });
  if (error) return dbError(error, "招待を受けられませんでした。時間をおいて再度お試しください");

  return NextResponse.json({ organizationId: data });
}
