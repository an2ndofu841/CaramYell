import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = ["pending", "preparing", "shipped", "delivered"];

/** 発送ステータス・追跡番号などの更新（プロジェクト作成者のみ） */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; backerId: string }> }
) {
  const { id, backerId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // 自分のプロジェクトか確認
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("creator_id", user.id)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await req.json();
  const { shippingStatus, trackingNumber, shippingCarrier, note } = body as {
    shippingStatus?: string;
    trackingNumber?: string;
    shippingCarrier?: string;
    note?: string;
  };

  const update: Record<string, unknown> = {};

  if (shippingStatus !== undefined) {
    if (!ALLOWED_STATUSES.includes(shippingStatus)) {
      return NextResponse.json(
        { error: "不正な発送ステータスです" },
        { status: 400 }
      );
    }
    update.shipping_status = shippingStatus;
    // 発送済みにした時刻を記録し、差し戻したらクリアする
    update.shipped_at =
      shippingStatus === "shipped" || shippingStatus === "delivered"
        ? new Date().toISOString()
        : null;
  }
  if (trackingNumber !== undefined) update.tracking_number = trackingNumber || null;
  if (shippingCarrier !== undefined) update.shipping_carrier = shippingCarrier || null;
  if (note !== undefined) update.fulfillment_note = note || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "更新内容がありません" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("backers")
    .update(update)
    .eq("id", backerId)
    .eq("project_id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ backer: data });
}
