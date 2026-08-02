import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("creator_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { data: backers, error } = await supabase
    .from("backers")
    .select(
      `
      *,
      rewards(id, title, reward_type),
      backer_items(id, reward_id, reward_title, unit_amount, quantity, needs_address)
    `
    )
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return dbError(error);
  }

  return NextResponse.json({ backers: backers || [] });
}
