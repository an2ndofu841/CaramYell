import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-guard";
import { dbError } from "@/lib/api/errors";
import type { UserRole } from "@/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase, user } = guard;

  const body = await req.json();
  const { role } = body as { role?: UserRole };

  if (role !== "user" && role !== "creator" && role !== "admin") {
    return NextResponse.json({ error: "不正な権限です" }, { status: 400 });
  }

  // 自分自身の管理者権限は剥奪できない（ロックアウト防止）
  if (id === user.id && role !== "admin") {
    return NextResponse.json(
      { error: "自分自身の管理者権限は変更できません" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select("id, role")
    .single();

  if (error) {
    return dbError(error);
  }

  return NextResponse.json({ profile: data });
}
