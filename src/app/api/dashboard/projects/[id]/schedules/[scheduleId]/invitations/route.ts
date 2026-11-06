import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { isEmailConfigured } from "@/lib/email/digital-reward";
import {
  schedulePageUrl,
  sendScheduleInvitations,
  sendScheduleInvitationTest,
} from "@/lib/email/reward-schedule";
import { createInviteToken } from "@/lib/organization/invite-token";
import { loadPaidBackers } from "@/lib/project/paid-backers";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { badRequest, loadManagedProject } from "@/lib/schedule/manage";
import {
  buildRoster,
  getServiceSupabase,
  PARTICIPANT_COLUMNS,
  SCHEDULE_COLUMNS,
  UUID_RE,
  type ParticipantRow,
} from "@/lib/schedule/server";
import type { Reward, RewardSchedule } from "@/types";

/**
 * 日程調整の案内メールを、対象の支援者へ送る（掲載者のみ）。
 *
 * 宛先はクライアントから受け取らず、支援データから組み立てる。
 * 1人ずつ専用リンク（トークン）を発行し、DB にはハッシュだけを残す。
 * 再送すると新しいリンクになり、前のリンクは使えなくなる（予約内容はそのまま）。
 *
 * mode:
 * - test: 自分にテスト送信（リンクはプレビューで予約できない）
 * - uninvited: まだ案内していない人へ
 * - unanswered: 案内済みで、まだ日程を選んでいない人へ再送
 */

export const maxDuration = 60;

const MAX_RECIPIENTS = 1000;
type Mode = "test" | "uninvited" | "unanswered";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const { id, scheduleId } = await params;
  const { supabase, user, project, denied } = await loadManagedProject(id);
  if (denied) return denied;

  const limit = rateLimit(`schedule-invite:${user.id}`, 10, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "メール送信の設定が完了していません。運営にお問い合わせください" },
      { status: 503 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const mode: Mode = (["test", "uninvited", "unanswered"] as const).includes(body.mode as Mode)
    ? (body.mode as Mode)
    : "uninvited";
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  if (mode !== "test" && !UUID_RE.test(requestId)) {
    return badRequest("送信IDが正しくありません");
  }

  const { data: scheduleRow } = await supabase
    .from("reward_schedules")
    .select(SCHEDULE_COLUMNS)
    .eq("id", scheduleId)
    .eq("project_id", id)
    .maybeSingle();
  if (!scheduleRow) {
    return NextResponse.json({ error: "日程調整が見つかりません" }, { status: 404 });
  }
  const schedule = scheduleRow as Omit<RewardSchedule, "slots">;

  if (schedule.status !== "open") {
    return badRequest("受付を終了している日程調整は案内できません。受付を再開してください");
  }
  if (schedule.deadline && new Date(schedule.deadline).getTime() < Date.now()) {
    return badRequest("回答期限を過ぎています。期限を延ばしてから案内してください");
  }

  const { count: futureSlots } = await supabase
    .from("reward_schedule_slots")
    .select("id", { count: "exact", head: true })
    .eq("schedule_id", scheduleId)
    .gt("starts_at", new Date().toISOString());
  if (!futureSlots) {
    return badRequest("選べる日時の枠がありません。先に候補の日時を追加してください");
  }

  const { data: rewards, error: rewardsError } = await supabase
    .from("rewards")
    .select("id, title, amount, reward_type, needs_address")
    .eq("project_id", id);
  if (rewardsError) return dbError(rewardsError);
  const reward = (rewards || []).find((r) => r.id === schedule.reward_id);

  const base = {
    projectTitle: project.title || "プロジェクト",
    rewardTitle: reward?.title ?? "",
    scheduleTitle: schedule.title,
    description: schedule.description,
    deadline: schedule.deadline,
  };

  if (mode === "test") {
    if (!user.email) return badRequest("アカウントにメールアドレスが登録されていません");
    const ok = await sendScheduleInvitationTest({
      ...base,
      to: user.email,
      nickname: "（お名前）",
      url: schedulePageUrl("preview"),
    });
    if (!ok) {
      return NextResponse.json(
        { error: "テストメールを送れませんでした。時間をおいて再度お試しください" },
        { status: 502 }
      );
    }
    return NextResponse.json({ testSentTo: user.email });
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: "サーバーの設定が不足しています" }, { status: 503 });
  }

  const [{ backers, error: backersError }, { data: participants, error: participantsError }] =
    await Promise.all([
      loadPaidBackers(supabase, id),
      supabase
        .from("reward_schedule_participants")
        .select(PARTICIPANT_COLUMNS)
        .eq("schedule_id", scheduleId),
    ]);
  if (backersError || !backers) return dbError(backersError);
  if (participantsError) return dbError(participantsError);

  const { roster } = buildRoster(
    schedule,
    backers,
    (rewards || []) as Reward[],
    (participants || []) as ParticipantRow[]
  );
  const targets = roster.filter((r) =>
    !r.eligible
      ? false
      : mode === "uninvited"
        ? !r.invitedAt
        : Boolean(r.invitedAt) && !r.slotId
  );

  if (targets.length === 0) {
    return badRequest(
      mode === "uninvited" ? "まだ案内していない支援者はいません" : "未回答の支援者はいません"
    );
  }
  if (targets.length > MAX_RECIPIENTS) {
    return badRequest(`一度に送れるのは${MAX_RECIPIENTS}人までです。運営にお問い合わせください`);
  }

  // 先にトークンを保存してからメールを送る（メールが届いたのにリンクが無効、を避ける）
  const backerIdsByEmail = new Map<string, string[]>();
  for (const b of backers) {
    const email = b.guest_email?.trim().toLowerCase();
    if (!email) continue;
    backerIdsByEmail.set(email, [...(backerIdsByEmail.get(email) ?? []), b.id]);
  }
  const tokens = new Map<string, string>();
  const rows = targets.map((t) => {
    const { token, hash } = createInviteToken();
    tokens.set(t.email, token);
    return {
      schedule_id: scheduleId,
      project_id: id,
      email: t.email,
      name: t.name,
      backer_ids: backerIdsByEmail.get(t.email) ?? [],
      token_hash: hash,
    };
  });
  const { error: upsertError } = await service
    .from("reward_schedule_participants")
    .upsert(rows, { onConflict: "schedule_id,email" });
  if (upsertError) return dbError(upsertError);

  const { sent, failed } = await sendScheduleInvitations(
    targets.map((t) => ({
      ...base,
      to: t.email,
      nickname: t.name || null,
      url: schedulePageUrl(tokens.get(t.email)!),
    })),
    requestId
  );

  let recordFailed = false;
  if (sent.length > 0) {
    const { error } = await service
      .from("reward_schedule_participants")
      .update({ invited_at: new Date().toISOString() })
      .eq("schedule_id", scheduleId)
      .in("email", sent);
    if (error) {
      console.error("[schedule-invite] record failed", error);
      recordFailed = true;
    }
  }

  return NextResponse.json({ sent: sent.length, failed: failed.length, recordFailed });
}
