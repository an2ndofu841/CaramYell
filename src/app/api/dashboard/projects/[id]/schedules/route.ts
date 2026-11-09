import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { isEmailConfigured } from "@/lib/email/digital-reward";
import { collectDigitalRecipients } from "@/lib/project/digital-delivery";
import { loadPaidBackers } from "@/lib/project/paid-backers";
import {
  badRequest,
  loadManagedProject,
  parseScheduleFields,
  parseSlots,
} from "@/lib/schedule/manage";
import {
  loadSchedulesWithRoster,
  SCHEDULE_COLUMNS,
  SLOT_COLUMNS,
  sortSlots,
} from "@/lib/schedule/server";
import type { Reward, RewardScheduleSlot, ScheduleTargetPreview } from "@/types";

/**
 * 体験リターンの日程調整（掲載者用）。
 * GET: 日程調整の一覧（枠・対象者・回答と確定の状況つき）と、リターンごとの対象者
 * POST: 日程調整を作る（候補の枠もまとめて作れる）
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, denied } = await loadManagedProject(id);
  if (denied) return denied;

  const [{ backers, error: backersError }, { data: rewards, error: rewardsError }] =
    await Promise.all([
      loadPaidBackers(supabase, id),
      supabase
        .from("rewards")
        .select("id, title, amount, reward_type, needs_address")
        .eq("project_id", id),
    ]);
  if (backersError || !backers) return dbError(backersError);
  if (rewardsError) return dbError(rewardsError);

  const { schedules, error } = await loadSchedulesWithRoster(
    supabase,
    id,
    backers,
    (rewards || []) as Reward[]
  );
  if (!schedules) return dbError(error as { message?: string });

  // 作成フォームで「このリターンなら誰が対象か」を先に見せる
  const targets: Record<string, ScheduleTargetPreview[]> = {};
  for (const r of rewards || []) {
    if (r.reward_type === "no_reward") continue;
    targets[r.id] = collectDigitalRecipients(backers, (rewards || []) as Reward[], r.id, []).recipients.map(
      (x) => ({ name: x.name, email: x.email, tickets: x.quantity })
    );
  }

  return NextResponse.json({
    schedules,
    targets,
    emailConfigured: isEmailConfigured(),
    testEmail: user.email ?? null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, denied } = await loadManagedProject(id);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const rewardId = typeof body.rewardId === "string" ? body.rewardId : "";

  const { data: reward } = await supabase
    .from("rewards")
    .select("id, reward_type")
    .eq("id", rewardId)
    .eq("project_id", id)
    .maybeSingle();
  if (!reward || reward.reward_type === "no_reward") {
    return badRequest("日程調整するリターンを選んでください");
  }

  const { fields, error: inputError } = parseScheduleFields(body, false);
  if (inputError) return badRequest(inputError);
  const { slots, error: slotError } = parseSlots(body.slots);
  if (slotError) return badRequest(slotError);

  const { data, error } = await supabase
    .from("reward_schedules")
    .insert({ ...fields, project_id: id, reward_id: reward.id, created_by: user.id })
    .select(SCHEDULE_COLUMNS)
    .single();
  if (error) return dbError(error);
  if (slots.length === 0) {
    return NextResponse.json({ schedule: { ...data, slots: [] } }, { status: 201 });
  }

  const { data: created, error: insertError } = await supabase
    .from("reward_schedule_slots")
    .insert(slots.map((s) => ({ ...s, schedule_id: data.id, project_id: id })))
    .select(SLOT_COLUMNS);
  if (insertError) {
    // 枠だけ欠けた日程調整を残さない
    await supabase.from("reward_schedules").delete().eq("id", data.id);
    return dbError(insertError);
  }

  return NextResponse.json(
    { schedule: { ...data, slots: sortSlots((created || []) as RewardScheduleSlot[]) } },
    { status: 201 }
  );
}
