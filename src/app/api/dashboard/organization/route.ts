import { NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/project/access";
import type { OrganizationInvitation, OrganizationMember } from "@/types";

/** 所属している事務所と、そのメンバー・招待中の一覧 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const organization = await getMembership(supabase, user.id);
  if (!organization) {
    return NextResponse.json({ organization: null, members: [], invitations: [] });
  }

  const { data: members, error } = await supabase.rpc(
    "list_organization_members",
    { p_org: organization.id }
  );
  if (error) return dbError(error);

  // 招待はオーナーにだけ見せる（RLS でもオーナー以外は0件になる）
  let invitations: OrganizationInvitation[] = [];
  if (organization.role === "owner") {
    const { data } = await supabase
      .from("organization_invitations")
      .select("id, email, role, expires_at, created_at")
      .eq("organization_id", organization.id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });
    invitations = (data ?? []) as OrganizationInvitation[];
  }

  return NextResponse.json({
    organization,
    members: (members ?? []) as OrganizationMember[],
    invitations,
  });
}
