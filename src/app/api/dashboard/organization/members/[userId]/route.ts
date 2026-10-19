import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/project/access";

/** メンバーの権限を変える（オーナーのみ） */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const organization = await getMembership(supabase, user.id);
  if (!organization || organization.role !== "owner") {
    return NextResponse.json(
      { error: "権限を変更できるのは事務所のオーナーだけです" },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }
  if (body.role !== "owner" && body.role !== "staff") {
    return NextResponse.json({ error: "不正な権限です" }, { status: 400 });
  }

  // 最後のオーナーを外す変更は DB のトリガーが止める
  const { data, error } = await supabase
    .from("organization_members")
    .update({ role: body.role })
    .eq("organization_id", organization.id)
    .eq("user_id", userId)
    .select("user_id, role");
  if (error) return dbError(error);
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "メンバーが見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ member: data[0] });
}

/** メンバーを外す（オーナー）・自分で抜ける（全員） */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const organization = await getMembership(supabase, user.id);
  if (!organization) {
    return NextResponse.json({ error: "事務所に所属していません" }, { status: 404 });
  }
  if (userId !== user.id && organization.role !== "owner") {
    return NextResponse.json(
      { error: "メンバーを外せるのは事務所のオーナーだけです" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organization.id)
    .eq("user_id", userId)
    .select("user_id");
  if (error) return dbError(error);
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "メンバーが見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
