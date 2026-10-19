import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-guard";
import { dbError } from "@/lib/api/errors";

/** 掲載申請の一覧（審査待ちを先頭に、新しい順） */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const { data, error } = await supabase
    .from("creator_applications")
    .select(
      "id, user_id, organization_name, organization_type, contact_name, contact_email, phone, website_url, artists, plan, expected_start, status, review_note, reviewed_at, created_at, profiles!creator_applications_user_id_fkey(display_name, role)"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return dbError(error);

  const order = { pending: 0, approved: 1, rejected: 2 } as const;
  const applications = (data ?? []).sort(
    (a, b) =>
      order[a.status as keyof typeof order] - order[b.status as keyof typeof order]
  );

  return NextResponse.json({ applications });
}
