import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { blankToNull } from "@/lib/api/text";
import { createClient } from "@/lib/supabase/server";
import { resolveFinalGoal, splitMilestones } from "@/lib/project/goals";

/**
 * ネクストゴール（最終目標のさらに上に置くプラスアルファのゴール）。
 *
 * 掲載中でも掲載者が足せる唯一のゴール。基本の段階ゴール（最終目標の分母）
 * は掲載開始後に動かせないので、ここでは is_stretch = true の行しか触らない。
 * DB 側にも同じ制約（guard_milestone_writes）があり、API を迂回しても
 * 基本の段階は変えられない。
 */

const MAX_TITLE = 60;
const MAX_DESCRIPTION = 200;

async function loadOwnedProject(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, project: null };

  const { data: project } = await supabase
    .from("projects")
    .select("id, goal_amount, project_milestones(id, amount, is_stretch, sort_order)")
    .eq("id", id)
    .eq("creator_id", user.id)
    .maybeSingle();

  return { supabase, user, project };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, project } = await loadOwnedProject(id);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  if (!project) {
    return NextResponse.json(
      { error: "プロジェクトが見つかりません" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const amount = Number(body.amount);
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  if (!title) {
    return NextResponse.json(
      { error: "達成内容を入力してください" },
      { status: 400 }
    );
  }
  if (title.length > MAX_TITLE) {
    return NextResponse.json(
      { error: `達成内容は${MAX_TITLE}文字以内で入力してください` },
      { status: 400 }
    );
  }
  if (description.length > MAX_DESCRIPTION) {
    return NextResponse.json(
      { error: `補足説明は${MAX_DESCRIPTION}文字以内で入力してください` },
      { status: 400 }
    );
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "金額は1円以上の整数で入力してください" },
      { status: 400 }
    );
  }

  // ネクストゴールは最終目標のさらに上に置く。下に置くと達成済みのネクストゴールが
  // 生まれて表示が破綻するし、最終目標の意味も曖昧になる
  const milestones = (project.project_milestones ?? []) as {
    id: string;
    amount: number;
    is_stretch?: boolean | null;
    sort_order?: number | null;
  }[];
  const { base, stretch } = splitMilestones(milestones);
  const finalGoal = resolveFinalGoal(Number(project.goal_amount) || 0, base);
  if (amount <= finalGoal) {
    return NextResponse.json(
      {
        error: `ネクストゴールの金額は最終目標（¥${finalGoal.toLocaleString()}）より大きくしてください`,
      },
      { status: 400 }
    );
  }
  if (stretch.some((m) => m.amount === amount)) {
    return NextResponse.json(
      { error: "同じ金額のネクストゴールがすでにあります" },
      { status: 400 }
    );
  }

  const nextOrder =
    milestones.reduce((max, m) => Math.max(max, m.sort_order ?? 0), -1) + 1;

  const { data, error } = await supabase
    .from("project_milestones")
    .insert({
      project_id: id,
      amount,
      title,
      description: blankToNull(description),
      sort_order: nextOrder,
      is_stretch: true,
    })
    .select()
    .single();

  if (error) return dbError(error);

  return NextResponse.json({ milestone: data }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, project } = await loadOwnedProject(id);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  if (!project) {
    return NextResponse.json(
      { error: "プロジェクトが見つかりません" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const milestoneId =
    typeof body.milestoneId === "string" ? body.milestoneId : "";
  if (!milestoneId) {
    return NextResponse.json(
      { error: "削除するネクストゴールを指定してください" },
      { status: 400 }
    );
  }

  // 基本の段階ゴールはこの導線では消させない（is_stretch で絞る）
  const { data, error } = await supabase
    .from("project_milestones")
    .delete()
    .eq("id", milestoneId)
    .eq("project_id", id)
    .eq("is_stretch", true)
    .select("id");

  if (error) return dbError(error);
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "ネクストゴールが見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
