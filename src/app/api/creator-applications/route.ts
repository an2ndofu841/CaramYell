import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { dbError } from "@/lib/api/errors";
import { blankToNull, lengthError } from "@/lib/api/text";
import { organizationTypeLabel } from "@/lib/config/organization-types";
import { sendContactInquiry } from "@/lib/email/contact-inquiry";
import { absoluteUrl } from "@/lib/config/site";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const APPLICATION_COLUMNS =
  "id, user_id, organization_name, organization_type, contact_name, contact_email, phone, website_url, artists, plan, expected_start, status, review_note, reviewed_at, created_at";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** 自分の申請（新しい順）。申請ページで審査状況を出すのに使う */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("creator_applications")
    .select(APPLICATION_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) return dbError(error);

  return NextResponse.json({ applications: data ?? [] });
}

/** 掲載申請を出す。ログインしている本人の名義でだけ作れる */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const limit = rateLimit(clientKey(req, `creator-application:${user.id}`), 5, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("リクエストの形式が正しくありません");
  }

  const organizationName = blankToNull(body.organizationName);
  const organizationType = typeof body.organizationType === "string" ? body.organizationType : "";
  const contactName = blankToNull(body.contactName);
  const contactEmail = blankToNull(body.contactEmail);
  const phone = blankToNull(body.phone);
  const websiteUrl = blankToNull(body.websiteUrl);
  const artists = blankToNull(body.artists);
  const plan = blankToNull(body.plan);
  const expectedStart = blankToNull(body.expectedStart);

  if (!organizationName) return badRequest("事務所・団体名を入力してください");
  const typeLabel = organizationTypeLabel(organizationType);
  if (!typeLabel) return badRequest("団体の種別を選んでください");
  if (!contactName) return badRequest("ご担当者のお名前を入力してください");
  if (!contactEmail || !EMAIL_PATTERN.test(contactEmail)) {
    return badRequest("連絡先のメールアドレスを正しく入力してください");
  }
  if (!plan) return badRequest("予定している企画の内容を入力してください");
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
    return badRequest("WebサイトのURLは http:// または https:// から入力してください");
  }

  const tooLong = lengthError([
    { label: "事務所・団体名", value: organizationName, max: 100 },
    { label: "ご担当者のお名前", value: contactName, max: 100 },
    { label: "メールアドレス", value: contactEmail, max: 254 },
    { label: "電話番号", value: phone, max: 30 },
    { label: "WebサイトのURL", value: websiteUrl, max: 500 },
    { label: "所属アーティスト・活動内容", value: artists, max: 2000 },
    { label: "企画の内容", value: plan, max: 4000 },
    { label: "開始したい時期", value: expectedStart, max: 100 },
  ]);
  if (tooLong) return badRequest(tooLong);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role === "creator" || profile?.role === "admin") {
    return badRequest("このアカウントはすでに掲載できる状態です");
  }

  const { data, error } = await supabase
    .from("creator_applications")
    .insert({
      user_id: user.id,
      organization_name: organizationName,
      organization_type: organizationType,
      contact_name: contactName,
      contact_email: contactEmail,
      phone,
      website_url: websiteUrl,
      artists,
      plan,
      expected_start: expectedStart,
    })
    .select(APPLICATION_COLUMNS)
    .single();

  if (error) {
    // 審査待ちは1人1件（部分ユニーク索引）
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "審査中の申請があります。結果のご連絡までお待ちください" },
        { status: 409 }
      );
    }
    return dbError(error);
  }

  // 運営の受付アドレスへ知らせる。届かなくても申請自体は運営CMSに残るので失敗扱いにはしない
  await sendContactInquiry({
    name: `${organizationName}（${contactName}）`,
    email: contactEmail,
    categoryLabel: "掲載申請",
    projectUrl: absoluteUrl("/admin/applications"),
    message: [
      `団体の種別: ${typeLabel}`,
      phone ? `電話番号: ${phone}` : null,
      websiteUrl ? `Webサイト: ${websiteUrl}` : null,
      expectedStart ? `開始したい時期: ${expectedStart}` : null,
      "",
      "■ 所属アーティスト・活動内容",
      artists ?? "（未記入）",
      "",
      "■ 予定している企画",
      plan,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  }).catch(() => false);

  return NextResponse.json({ application: data }, { status: 201 });
}
