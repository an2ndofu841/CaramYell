import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { TEXT_LIMITS, blankToNull, lengthError } from "@/lib/api/text";
import { campaignEndFromInput } from "@/lib/date/campaign-end";
import { createClient } from "@/lib/supabase/server";
import { resolveTheme } from "@/lib/theme/project-theme";
import { resolveFaqs } from "@/lib/project/faqs";
import { autoSlug, normalizeSlug, slugError } from "@/lib/project/slug";

/** slug の UNIQUE 制約に当たったとき Postgres が返すコード */
const SLUG_TAKEN = "23505";

const slugTakenResponse = () =>
  NextResponse.json(
    { error: "このURLは既に使われています。別のURLにしてください" },
    { status: 409 }
  );

/**
 * or() は文字列で組み立てるため、値に , や ) が混ざると別の条件として
 * 解釈されてしまう。フィルタ構文と LIKE のワイルドカードを落として長さも切る。
 */
function sanitizeSearch(raw: string | null): string {
  if (!raw) return "";
  return raw
    .replace(/[,()"'\\%_*.:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

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
      categories(id, slug, name_ja, name_en, icon, color),
      project_milestones(id, amount, title, sort_order)
    `)
    .in("status", ["active", "funded", "completed"]);

  if (category && category !== "all") {
    query = query.eq("categories.slug", category);
  }

  const term = sanitizeSearch(search);
  if (term) {
    query = query.or(`title.ilike.%${term}%,tagline.ilike.%${term}%`);
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
    return dbError(error);
  }

  return NextResponse.json({ projects: data, count });
}

const MAX_GALLERY_IMAGES = 8;

/**
 * 画像は自分たちのストレージに上げたものだけ受ける。任意の URL を通すと
 * next/image の許可ホストから外れて表示できないうえ、掲載者が選んだ
 * 外部サーバーへ閲覧者を取りにいかせることになる。
 */
// 末尾スラッシュの有無で判定がずれると、画像が黙って捨てられる
const STORAGE_PREFIX = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/project-images/`
  : null;

function ownStorageUrl(value: unknown): string | null {
  if (!STORAGE_PREFIX || typeof value !== "string") return null;
  return value.startsWith(STORAGE_PREFIX) ? value : null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // プロジェクト作成は運営が承認した掲載者のみ
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "creator" && profile?.role !== "admin") {
    return NextResponse.json(
      { error: "プロジェクトの掲載には運営の承認が必要です。" },
      { status: 403 }
    );
  }

  const body = await req.json();

  const tooLong = lengthError([
    { label: "タイトル", value: body.title, max: TEXT_LIMITS.title },
    { label: "タグライン", value: body.tagline, max: TEXT_LIMITS.tagline },
    { label: "プロジェクト概要", value: body.description, max: TEXT_LIMITS.description },
    { label: "ストーリー", value: body.story, max: TEXT_LIMITS.story },
    { label: "英語のタイトル", value: body.titleEn, max: TEXT_LIMITS.title },
    { label: "英語のタグライン", value: body.taglineEn, max: TEXT_LIMITS.tagline },
    {
      label: "英語のプロジェクト概要",
      value: body.descriptionEn,
      max: TEXT_LIMITS.description,
    },
    { label: "英語のストーリー", value: body.storyEn, max: TEXT_LIMITS.story },
  ]);
  if (tooLong) {
    return NextResponse.json({ error: tooLong }, { status: 400 });
  }

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
    categoryId,
    tags,
    goalAmount,
    endDate,
    milestones,
    rewards,
    faqs,
    allowFreeAmount,
    allowComments,
    mainImageUrl,
    images,
    theme,
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

  // 掲載者が決めた公開URL。未入力ならタイトルから自動で作る
  const desiredSlug = normalizeSlug(slug);
  if (desiredSlug) {
    const invalid = slugError(desiredSlug);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }
  }

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

  const fields: Record<string, unknown> = {
    title: title || "",
    tagline: tagline || title || "",
    description: description || "",
    story: story || null,
    category_id: categoryUuid,
    tags: tags || [],
    goal_amount: baseGoalAmount,
    // 英語はすべて任意。空欄は null にして日本語へのフォールバックに任せる
    title_en: blankToNull(titleEn),
    tagline_en: blankToNull(taglineEn),
    description_en: blankToNull(descriptionEn),
    story_en: blankToNull(storyEn),
    faqs: resolveFaqs(faqs),
    end_date: campaignEndFromInput(endDate),
    allow_free_amount: allowFreeAmount !== false,
    allow_comments: allowComments !== false,
    status,
    submitted_at: isDraft ? null : new Date().toISOString(),
  };

  // 掲載者が書いた色やフォントをそのまま CSS に流すことになるので、
  // 受け取った値は必ず resolveTheme に通してから保存する
  if (theme !== undefined) {
    fields.theme = theme === null ? null : resolveTheme(theme);
  }

  // 送ってきたときだけ触る。省略された画像を消してしまわないように
  if (mainImageUrl !== undefined) {
    fields.main_image_url = ownStorageUrl(mainImageUrl);
  }
  if (images !== undefined) {
    fields.images = Array.isArray(images)
      ? images
          .map(ownStorageUrl)
          .filter((url): url is string => url !== null)
          .slice(0, MAX_GALLERY_IMAGES)
      : [];
  }

  let project;

  if (projectId) {
    // 既存の下書きを更新（本人のもののみ）
    const { data: existing } = await supabase
      .from("projects")
      .select("id, creator_id, status")
      .eq("id", projectId)
      .maybeSingle();
    if (!existing || existing.creator_id !== user.id) {
      return NextResponse.json({ error: "対象のプロジェクトが見つかりません" }, { status: 404 });
    }
    // この導線はリターンと段階ゴールを作り直すため、公開後に通すと
    // 支援受付中のリターンが消えてしまう。公開後の編集はダッシュボードから。
    if (!["draft", "reviewing", "cancelled"].includes(existing.status)) {
      return NextResponse.json(
        {
          error:
            "公開中のプロジェクトはこの画面から更新できません。ダッシュボードから編集してください",
        },
        { status: 409 }
      );
    }
    const { data, error } = await supabase
      .from("projects")
      // 公開前なので URL を変えても外に出したリンクは壊れない
      .update(desiredSlug ? { ...fields, slug: desiredSlug } : fields)
      .eq("id", projectId)
      .select()
      .single();
    if (error) {
      if (error.code === SLUG_TAKEN) return slugTakenResponse();
      return dbError(error);
    }
    project = data;
    // 子レコードは作り直し
    await supabase.from("rewards").delete().eq("project_id", projectId);
    await supabase.from("project_milestones").delete().eq("project_id", projectId);
  } else {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        creator_id: user.id,
        slug: desiredSlug || autoSlug(title),
        ...fields,
      })
      .select()
      .single();
    if (error) {
      if (error.code === SLUG_TAKEN) return slugTakenResponse();
      return dbError(error);
    }
    project = data;
  }

  if (rewards && rewards.length > 0) {
    const { error: rewardsError } = await supabase.from("rewards").insert(
      rewards.map((r: Record<string, unknown>, i: number) => ({
        project_id: project.id,
        title: r.title || "",
        description: r.description || "",
        title_en: blankToNull(r.titleEn),
        description_en: blankToNull(r.descriptionEn),
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
