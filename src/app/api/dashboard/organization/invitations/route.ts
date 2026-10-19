import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";
import { sendOrganizationInvitation } from "@/lib/email/organization-invitation";
import { createInviteToken } from "@/lib/organization/invite-token";
import { getMembership } from "@/lib/project/access";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 未受諾の招待が UNIQUE 制約に当たったとき */
const ALREADY_INVITED = "23505";

/** オーナーがメールアドレス宛てに招待を送る */
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const limited = rateLimit(clientKey(req, `org-invite:${user.id}`), 20, 60 * 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);

  const organization = await getMembership(supabase, user.id);
  if (!organization || organization.role !== "owner") {
    return NextResponse.json(
      { error: "メンバーを招待できるのは事務所のオーナーだけです" },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body.role === "owner" ? "owner" : "staff";
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "メールアドレスを正しく入力してください" }, { status: 400 });
  }

  const { data: members } = await supabase.rpc("list_organization_members", {
    p_org: organization.id,
  });
  if ((members ?? []).some((m: { email: string | null }) => m.email?.toLowerCase() === email)) {
    return NextResponse.json({ error: "このメールアドレスの方はすでにメンバーです" }, { status: 409 });
  }

  const { token, hash } = createInviteToken();
  const { data: invitation, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: organization.id,
      email,
      role,
      token_hash: hash,
      invited_by: user.id,
    })
    .select("id, email, role, expires_at, created_at")
    .single();
  if (error) {
    if (error.code === ALREADY_INVITED) {
      return NextResponse.json(
        { error: "このメールアドレスにはすでに招待を送っています。送り直す場合は先に取り消してください" },
        { status: 409 }
      );
    }
    return dbError(error);
  }

  const { data: inviter } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const sent = await sendOrganizationInvitation({
    to: email,
    organizationName: organization.name,
    inviterName: inviter?.display_name ?? null,
    role,
    token,
    expiresAt: invitation.expires_at,
  });
  if (!sent) {
    // 届かない招待を残すと、送り直しが「招待済み」で弾かれてしまう
    await supabase.from("organization_invitations").delete().eq("id", invitation.id);
    return NextResponse.json(
      { error: "招待メールを送れませんでした。時間をおいて再度お試しください" },
      { status: 502 }
    );
  }

  return NextResponse.json({ invitation });
}
