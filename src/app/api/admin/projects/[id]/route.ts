import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project: data });
}
