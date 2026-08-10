import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-guard";
import { dbError } from "@/lib/api/errors";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase, user } = guard;

  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) {
    return dbError(error);
  }

  return NextResponse.json({ users: data || [], selfId: user.id });
}
