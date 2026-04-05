import { NextRequest, NextResponse } from "next/server";
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

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      categories(id, slug, name_ja, icon, color),
      rewards(*)
    `
    )
    .eq("id", id)
    .eq("creator_id", user.id)
    .single();

  if (error || !project) {
    return NextResponse.json(
      { error: "プロジェクトが見つかりません" },
      { status: 404 }
    );
  }

  const { data: backers } = await supabase
    .from("backers")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const { data: updates } = await supabase
    .from("project_updates")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const paidBackers = (backers || []).filter((b) => b.status === "paid");
  const stats = {
    totalRaised: paidBackers.reduce((sum, b) => sum + b.amount, 0),
    totalBackers: paidBackers.length,
    avgBacking:
      paidBackers.length > 0
        ? Math.round(
            paidBackers.reduce((sum, b) => sum + b.amount, 0) /
              paidBackers.length
          )
        : 0,
    progressPercentage: Math.min(
      Math.round(
        ((project.current_amount || 0) / (project.goal_amount || 1)) * 100
      ),
      100
    ),
    daysLeft: project.end_date
      ? Math.max(
          0,
          Math.ceil(
            (new Date(project.end_date).getTime() - Date.now()) / 86400000
          )
        )
      : 0,
  };

  return NextResponse.json({
    project,
    backers: backers || [],
    updates: updates || [],
    stats,
  });
}

export async function PUT(
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

  const body = await req.json();
  const { title, tagline, description, story, goalAmount, endDate } = body;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (tagline !== undefined) updateData.tagline = tagline;
  if (description !== undefined) updateData.description = description;
  if (story !== undefined) updateData.story = story;
  if (goalAmount !== undefined) updateData.goal_amount = goalAmount;
  if (endDate !== undefined) updateData.end_date = endDate;

  const { data, error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", id)
    .eq("creator_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project: data });
}
