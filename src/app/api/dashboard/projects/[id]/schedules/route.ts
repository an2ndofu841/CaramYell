import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { isEmailConfigured } from "@/lib/email/digital-reward";
import { loadPaidBackers } from "@/lib/project/paid-backers";
import { badRequest, loadManagedProject, parseScheduleFields } from "@/lib/schedule/manage";
import { loadSchedulesWithRoster, SCHEDULE_COLUMNS } from "@/lib/schedule/server";
import type { Reward } from "@/types";

/**
 * 体験リターンの日程調整（掲載者用）。
 * GET: 日程調整の一覧（枠・対象者・予約状況つき）
 * POST: 日程調整を作る
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

  return NextResponse.json({
    schedules,
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

  const { data, error } = await supabase
    .from("reward_schedules")
    .insert({ ...fields, project_id: id, reward_id: reward.id, created_by: user.id })
    .select(SCHEDULE_COLUMNS)
    .single();
  if (error) return dbError(error);

  return NextResponse.json({ schedule: { ...data, slots: [] } }, { status: 201 });
}
