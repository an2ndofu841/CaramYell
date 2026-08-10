import { NextResponse, type NextRequest } from "next/server";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { contactCategoryLabel } from "@/lib/config/contact-categories";
import { sendContactInquiry } from "@/lib/email/contact-inquiry";

const LIMITS = {
  name: 100,
  email: 254,
  projectUrl: 500,
  message: 5000,
};

const MIN_MESSAGE = 10;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  // フォームは未ログインでも送れるので、IP 単位で連投を抑える
  const limit = rateLimit(clientKey(req, "contact"), 5, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("リクエストの形式が正しくありません");
  }

  const payload = body as Record<string, unknown>;

  // 画面には出していない入力欄。埋まっていれば自動投稿とみなし、
  // 相手に気づかせないよう成功として返す
  if (readString(payload.website)) {
    return NextResponse.json({ ok: true, delivered: true });
  }

  const name = readString(payload.name);
  const email = readString(payload.email);
  const category = readString(payload.category);
  const projectUrl = readString(payload.projectUrl);
  const message = readString(payload.message);

  if (!name) return badRequest("お名前を入力してください");
  if (name.length > LIMITS.name) return badRequest("お名前が長すぎます");

  if (!email) return badRequest("メールアドレスを入力してください");
  if (email.length > LIMITS.email || !EMAIL_PATTERN.test(email)) {
    return badRequest("メールアドレスの形式が正しくありません");
  }

  const categoryLabel = contactCategoryLabel(category);
  if (!categoryLabel) return badRequest("お問い合わせの種別を選択してください");

  if (projectUrl.length > LIMITS.projectUrl) {
    return badRequest("プロジェクトのURLが長すぎます");
  }

  if (message.length < MIN_MESSAGE) {
    return badRequest(`お問い合わせ内容は${MIN_MESSAGE}文字以上で入力してください`);
  }
  if (message.length > LIMITS.message) {
    return badRequest("お問い合わせ内容が長すぎます");
  }

  const delivered = await sendContactInquiry({
    name,
    email,
    categoryLabel,
    projectUrl: projectUrl || null,
    message,
  });

  // 送信に失敗しても、直接メールしてもらう案内に切り替えられるよう
  // 結果を返す。フォームの入力自体は無駄にしない
  return NextResponse.json({ ok: true, delivered });
}
