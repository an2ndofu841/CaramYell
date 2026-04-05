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

  const body = await req.json();
  const { title, description, amount, rewardType, needsAddress, quantityTotal } = body;

  if (!title || !amount) {
    return NextResponse.json(
      { error: "タイトルと金額は必須です" },
      { status: 400 }
    );
  }

  const { data: existingRewards } = await supabase
    .from("rewards")
    .select("sort_order")
    .eq("project_id", id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existingRewards?.[0]?.sort_order
    ? existingRewards[0].sort_order + 1
    : 0;

  const { data, error } = await supabase
    .from("rewards")
    .insert({
      project_id: id,
      title,
      description: description || "",
      amount,
      reward_type: rewardType || "physical",
      needs_address: needsAddress ?? true,
      quantity_total: quantityTotal || null,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reward: data }, { status: 201 });
}

export async function DELETE(
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

  const { rewardId } = await req.json();

  const { error } = await supabase
    .from("rewards")
    .delete()
    .eq("id", rewardId)
    .eq(
      "project_id",
      id
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
