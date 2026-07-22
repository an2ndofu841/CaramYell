import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const category = searchParams.get("category");
  const sort = searchParams.get("sort") || "trending";
  const search = searchParams.get("search");
  const featured = searchParams.get("featured");
  const limit = parseInt(searchParams.get("limit") || "12");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("projects")
    .select(`
      *,
      profiles!projects_creator_id_fkey(id, display_name, avatar_url),
      categories(id, slug, name_ja, name_en, icon, color)
    `)
    .in("status", ["active", "funded", "completed"]);

  if (category && category !== "all") {
    query = query.eq("categories.slug", category);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,tagline.ilike.%${search}%`);
  }

  if (featured === "true") {
    query = query.eq("featured", true);
  }

  switch (sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "ending_soon":
      query = query.order("end_date", { ascending: true });
      break;
    case "most_funded":
      query = query.order("current_amount", { ascending: false });
      break;
    case "most_backers":
      query = query.order("backer_count", { ascending: false });
      break;
    default: // trending
      query = query.order("share_count", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data, count });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // プロジェクト作成は当面、弊社（管理者）アカウントのみに限定
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "プロジェクトの作成は現在準備中です。一般公開までお待ちください。" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const {
    title,
    tagline,
    description,
    story,
    categoryId,
    tags,
    goalAmount,
    endDate,
    milestones,
    rewards,
    allowFreeAmount,
    allowComments,
    mode,
    projectId,
  } = body;

  // mode: 'draft'（途中保存）or 'submit'（申請）。既定は申請。
  const isDraft = mode === "draft";
  const status = isDraft ? "draft" : "reviewing";

  // 段階ゴールを金額昇順に整列。基本目標(goal_amount)は最小段階の金額。
  const sortedMilestones: { amount: number; title: string; description?: string }[] =
    Array.isArray(milestones)
      ? [...milestones]
          .filter((m) => m && Number(m.amount) > 0 && String(m.title || "").trim())
          .map((m) => ({
            amount: Number(m.amount),
            title: String(m.title).trim(),
            description: m.description ? String(m.description) : undefined,
          }))
          .sort((a, b) => a.amount - b.amount)
      : [];

  const baseGoalAmount =
    sortedMilestones.length > 0 ? sortedMilestones[0].amount : goalAmount || 0;

  // categoryId はスラッグ（例: "music"）で届くので UUID に解決する
  let categoryUuid: string | null = null;
  if (categoryId) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categoryId)
      .maybeSingle();
    categoryUuid = cat?.id ?? null;
  }

  const fields = {
    title: title || "",
    tagline: tagline || title || "",
    description: description || "",
    story: story || null,
    category_id: categoryUuid,
    tags: tags || [],
    goal_amount: baseGoalAmount,
    end_date: endDate || null,
    allow_free_amount: allowFreeAmount !== false,
    allow_comments: allowComments !== false,
    status,
    submitted_at: isDraft ? null : new Date().toISOString(),
  };

  let project;

  if (projectId) {
    // 既存の下書きを更新（本人のもののみ）
    const { data: existing } = await supabase
      .from("projects")
      .select("id, creator_id")
      .eq("id", projectId)
      .maybeSingle();
    if (!existing || existing.creator_id !== user.id) {
      return NextResponse.json({ error: "対象のプロジェクトが見つかりません" }, { status: 404 });
    }
    const { data, error } = await supabase
      .from("projects")
      .update(fields)
      .eq("id", projectId)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    project = data;
    // 子レコードは作り直し
    await supabase.from("rewards").delete().eq("project_id", projectId);
    await supabase.from("project_milestones").delete().eq("project_id", projectId);
  } else {
    const slug =
      ((title || "project")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim() || "project") +
      "-" +
      Math.random().toString(36).substr(2, 6);
    const { data, error } = await supabase
      .from("projects")
      .insert({ creator_id: user.id, slug, ...fields })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    project = data;
  }

  if (rewards && rewards.length > 0) {
    const { error: rewardsError } = await supabase.from("rewards").insert(
      rewards.map((r: Record<string, unknown>, i: number) => ({
        project_id: project.id,
        title: r.title || "",
        description: r.description || "",
        amount: r.amount || 0,
        reward_type: r.rewardType,
        needs_address: r.needsAddress,
        quantity_total: r.quantityTotal || null,
        sort_order: i,
      }))
    );

    if (rewardsError) {
      console.error("Error creating rewards:", rewardsError);
    }
  }

  if (sortedMilestones.length > 0) {
    const { error: milestonesError } = await supabase
      .from("project_milestones")
      .insert(
        sortedMilestones.map((m, i) => ({
          project_id: project.id,
          amount: m.amount,
          title: m.title,
          description: m.description || null,
          sort_order: i,
        }))
      );

    if (milestonesError) {
      console.error("Error creating milestones:", milestonesError);
    }
  }

  return NextResponse.json({ project }, { status: projectId ? 200 : 201 });
}
