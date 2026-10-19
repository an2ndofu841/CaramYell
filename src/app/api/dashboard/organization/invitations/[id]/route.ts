import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/project/access";

/** 受諾前の招待を取り消す（オーナーのみ） */
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

  const organization = await getMembership(supabase, user.id);
  if (!organization || organization.role !== "owner") {
    return NextResponse.json(
      { error: "招待を取り消せるのは事務所のオーナーだけです" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("organization_invitations")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization.id)
    .is("accepted_at", null)
    .select("id");
  if (error) return dbError(error);
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "招待が見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
