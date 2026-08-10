import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-guard";
import { dbError } from "@/lib/api/errors";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const body = await req.json();
  const { action, reason, status, featured } = body as {
    action?: "approve" | "reject";
    reason?: string;
    status?: string;
    featured?: boolean;
  };

  const allowedStatuses = [
    "draft",
    "reviewing",
    "active",
    "funded",
    "failed",
    "completed",
    "cancelled",
  ];

  let update: Record<string, unknown> = {};
  if (action === "approve") {
    update = {
      status: "active",
      reviewed_at: new Date().toISOString(),
      start_date: new Date().toISOString(),
    };
  } else if (action === "reject") {
    update = {
      status: "cancelled",
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || null,
    };
  } else {
    // 汎用更新（プロジェクト管理から）
    if (typeof featured === "boolean") update.featured = featured;
    if (typeof status === "string") {
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ error: "不正なステータスです" }, { status: 400 });
      }
      update.status = status;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "不正な操作です" }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return dbError(error);
  }

  return NextResponse.json({ project: data });
}
