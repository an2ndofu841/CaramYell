import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "reviewing";
  const search = searchParams.get("search")?.trim();

  let query = supabase
    .from("projects")
    .select(
      `
      *,
      profiles!projects_creator_id_fkey(id, display_name, avatar_url),
      categories(id, slug, name_ja, icon, color)
    `
    );

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  // 審査中は申請順、それ以外は新しい順
  query =
    status === "reviewing"
      ? query
          .order("submitted_at", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true })
      : query.order("created_at", { ascending: false });

  const { data, error } = await query.limit(200);

  if (error) {
    return dbError(error);
  }

  return NextResponse.json({ projects: data || [] });
}
