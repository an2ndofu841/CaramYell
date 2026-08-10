import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 運営APIの入口。ログイン・admin ロール・二段階認証の3点をまとめて確認する。
 *
 * /admin の画面側（layout.tsx）では aal2 を要求していたのに API 側では
 * ロールしか見ていなかった。パスワードだけ盗まれた状態でも、画面を経由せず
 * API を直接叩けば利用者一覧の取得も権限変更もプロジェクト承認も通ってしまい、
 * 二段階認証を入れた意味が無くなる。
 *
 * 通過したら supabase クライアントと user を返し、弾いたら NextResponse を返す。
 */
export async function requireAdmin(): Promise<
  | { ok: true; supabase: SupabaseClient; user: { id: string } }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "認証が必要です" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "権限がありません" }, { status: 403 }),
    };
  }

  // getClaims は JWT を検証したうえで claims を返すので aal を信用してよい
  const { data: claims } = await supabase.auth.getClaims();
  if (claims?.claims.aal !== "aal2") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "二段階認証が必要です" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, supabase, user: { id: user.id } };
}
