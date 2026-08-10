import { NextRequest, NextResponse } from "next/server";
import { SLUG_TAKEN, dbError, slugTakenResponse } from "@/lib/api/errors";
import { TEXT_LIMITS, blankToNull, lengthError } from "@/lib/api/text";
import { campaignEndFromInput } from "@/lib/date/campaign-end";
import { createClient } from "@/lib/supabase/server";
import { countUniqueBackers } from "@/lib/utils";
import { resolveFaqs } from "@/lib/project/faqs";
import { canEditSlug, normalizeSlug, slugError } from "@/lib/project/slug";
import { resolveTheme } from "@/lib/theme/project-theme";

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
      rewards(*),
      project_milestones(id, amount, title, description, sort_order)
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

  // 発送タブが「送るもの」を出せるよう、リターンと明細も一緒に取得する
  const { data: backers } = await supabase
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

  const { data: updates } = await supabase
    .from("project_updates")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const paidBackers = (backers || []).filter((b) => b.status === "paid");
  const totalRaised = paidBackers.reduce((sum, b) => sum + b.amount, 0);
  const totalBackers = countUniqueBackers(paidBackers);
  const stats = {
    totalRaised,
    totalBackers,
    avgBacking: totalBackers > 0 ? Math.round(totalRaised / totalBackers) : 0,
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
  const {
    title,
    tagline,
    slug,
    description,
    story,
    titleEn,
    taglineEn,
    descriptionEn,
    storyEn,
    goalAmount,
    endDate,
    faqs,
    theme,
  } = body;

  const tooLong = lengthError([
    { label: "タイトル", value: title, max: TEXT_LIMITS.title },
    { label: "タグライン", value: tagline, max: TEXT_LIMITS.tagline },
    { label: "プロジェクト概要", value: description, max: TEXT_LIMITS.description },
    { label: "ストーリー", value: story, max: TEXT_LIMITS.story },
    { label: "英語のタイトル", value: titleEn, max: TEXT_LIMITS.title },
    { label: "英語のタグライン", value: taglineEn, max: TEXT_LIMITS.tagline },
    {
      label: "英語のプロジェクト概要",
      value: descriptionEn,
      max: TEXT_LIMITS.description,
    },
    { label: "英語のストーリー", value: storyEn, max: TEXT_LIMITS.story },
  ]);
  if (tooLong) {
    return NextResponse.json({ error: tooLong }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  // 公開URLは公開前だけ変えられる。画面は常に送ってくるので、
  // 実際に変わるときだけ掲載ステータスを見る。
  if (slug !== undefined) {
    const desired = normalizeSlug(slug);
    const invalid = desired
      ? slugError(desired)
      : "公開URLを入力してください";
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("projects")
      .select("slug, status")
      .eq("id", id)
      .eq("creator_id", user.id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json(
        { error: "プロジェクトが見つかりません" },
        { status: 404 }
      );
    }
    if (desired !== existing.slug) {
      if (!canEditSlug(existing.status)) {
        return NextResponse.json(
          {
            error:
              "公開後は公開URLを変更できません。共有済みのリンクが開けなくなるためです",
          },
          { status: 409 }
        );
      }
      updateData.slug = desired;
    }
  }

  if (title !== undefined) updateData.title = title;
  if (tagline !== undefined) updateData.tagline = tagline;
  if (description !== undefined) updateData.description = description;
  if (story !== undefined) updateData.story = story;
  if (titleEn !== undefined) updateData.title_en = blankToNull(titleEn);
  if (taglineEn !== undefined) updateData.tagline_en = blankToNull(taglineEn);
  if (descriptionEn !== undefined) {
    updateData.description_en = blankToNull(descriptionEn);
  }
  if (storyEn !== undefined) updateData.story_en = blankToNull(storyEn);
  if (goalAmount !== undefined) updateData.goal_amount = goalAmount;
  if (endDate !== undefined) updateData.end_date = campaignEndFromInput(endDate);
  if (faqs !== undefined) updateData.faqs = resolveFaqs(faqs);
  // null は「既定テーマに戻す」の意味なのでそのまま通す
  if (theme !== undefined) {
    updateData.theme = theme === null ? null : resolveTheme(theme);
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", id)
    .eq("creator_id", user.id)
    .select()
    .single();

  if (error) {
    if (error.code === SLUG_TAKEN) return slugTakenResponse();
    return dbError(error);
  }

  return NextResponse.json({ project: data });
}

export async function DELETE(
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

  // 本人のプロジェクトか確認
  const { data: project } = await supabase
    .from("projects")
    .select("id, creator_id")
    .eq("id", id)
    .eq("creator_id", user.id)
    .maybeSingle();

  if (!project) {
    return NextResponse.json(
      { error: "プロジェクトが見つかりません" },
      { status: 404 }
    );
  }

  // 決済済みの支援者がいる場合は削除を防ぐ（決済記録の保全）
  const { count } = await supabase
    .from("backers")
    .select("id", { count: "exact", head: true })
    .eq("project_id", id)
    .eq("status", "paid");

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "支援者がいるプロジェクトは削除できません。掲載を取り下げる場合はキャンセルをご利用ください。",
      },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) {
    return dbError(error);
  }

  return NextResponse.json({ success: true });
}
