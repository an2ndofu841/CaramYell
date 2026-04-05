import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
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

  const { title, content, isBackersOnly } = await req.json();

  if (!title || !content) {
    return NextResponse.json(
      { error: "タイトルと内容は必須です" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("project_updates")
    .insert({
      project_id: id,
      creator_id: user.id,
      title,
      content,
      is_backers_only: isBackersOnly || false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ update: data }, { status: 201 });
}
