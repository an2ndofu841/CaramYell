import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * ログイン中のユーザーが応援した支援の一覧。
 *
 * ログイン前にゲストとして応援した分も拾えるよう、user_id だけでなく
 * 同じメールアドレスの支援も含める（RLS 側も同じ条件を許可している）。
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const email = (user.email || "").trim().toLowerCase();
  const filters = [`user_id.eq.${user.id}`];
  if (email) filters.push(`guest_email.ilike.${email}`);

  const { data: backings, error } = await supabase
    .from("backers")
    .select(
      `
      *,
      backer_items(*),
      projects(
        id, title, slug, tagline, main_image_url, status,
        goal_amount, current_amount, backer_count, end_date,
        categories(id, slug, name_ja, icon, color)
      )
    `
    )
    .or(filters.join(","))
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ backings: backings || [] });
}
