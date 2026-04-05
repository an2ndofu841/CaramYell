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
      profiles(id, display_name, avatar_url),
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
    rewards,
  } = body;

  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim() +
    "-" +
    Math.random().toString(36).substr(2, 6);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      creator_id: user.id,
      title,
      slug,
      tagline,
      description,
      story,
      category_id: categoryId,
      tags: tags || [],
      goal_amount: goalAmount,
      end_date: endDate,
      status: "reviewing",
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  if (rewards && rewards.length > 0) {
    const { error: rewardsError } = await supabase.from("rewards").insert(
      rewards.map((r: Record<string, unknown>, i: number) => ({
        project_id: project.id,
        title: r.title,
        description: r.description,
        amount: r.amount,
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

  return NextResponse.json({ project }, { status: 201 });
}
