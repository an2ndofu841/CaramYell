import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-guard";
import { dbError } from "@/lib/api/errors";
import { blankToNull } from "@/lib/api/text";

/**
 * 掲載申請の審査。
 * - approve: 申請を承認し、申請者を掲載者（creator）にして事務所名を設定する
 * - reject: 見送る。review_note は申請者本人にも表示される
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase, user } = guard;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  const action = body.action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "不正な操作です" }, { status: 400 });
  }
  const note = blankToNull(body.note);
  if (note && note.length > 2000) {
    return NextResponse.json({ error: "連絡事項は2,000文字以内で入力してください" }, { status: 400 });
  }

  const { data: application, error: fetchError } = await supabase
    .from("creator_applications")
    .select("id, user_id, organization_name, status")
    .eq("id", id)
    .single();
  if (fetchError || !application) {
    return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 });
  }
  if (application.status !== "pending") {
    return NextResponse.json({ error: "この申請はすでに審査済みです" }, { status: 409 });
  }

  // 先に権限を付ける。申請の更新が後で失敗しても、もう一度承認し直せば揃う
  if (action === "approve") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", application.user_id)
      .single();

    const update: { organization_name: string; role?: "creator" } = {
      organization_name: application.organization_name,
    };
    // 管理者を掲載者に格下げしない
    if (profile?.role !== "admin") update.role = "creator";

    const { error: profileError } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", application.user_id);
    if (profileError) return dbError(profileError);
  }

  const { data, error } = await supabase
    .from("creator_applications")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      review_note: note,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, status, review_note, reviewed_at")
    .single();
  if (error) return dbError(error);

  return NextResponse.json({ application: data });
}
