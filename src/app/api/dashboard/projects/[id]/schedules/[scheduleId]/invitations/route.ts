import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { isEmailConfigured } from "@/lib/email/digital-reward";
import {
  schedulePageUrl,
  sendScheduleInvitations,
  sendScheduleInvitationTest,
} from "@/lib/email/reward-schedule";
import { createInviteToken } from "@/lib/organization/invite-token";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { badRequest, loadManagedProject, loadScheduleRoster } from "@/lib/schedule/manage";
import { getServiceSupabase, UUID_RE } from "@/lib/schedule/server";

/**
 * 日程調整の案内メールを、対象の支援者へ送る（掲載者のみ）。
 *
 * 宛先はクライアントから受け取らず、支援データから組み立てる。
 * 1人ずつ専用リンク（トークン）を発行し、DB にはハッシュだけを残す。
 * 再送すると新しいリンクになり、前のリンクは使えなくなる（回答内容はそのまま）。
 *
 * mode:
 * - test: 自分にテスト送信（リンクはプレビューで回答できない）
 * - uninvited: まだ案内していない人へ
 * - unanswered: 案内済みで、まだ回答していない（日程も確定していない）人へ再送
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

  const { schedule, roster, backers, rewards, error: loadError } = await loadScheduleRoster(
    supabase,
    id,
    scheduleId
  );
  if (loadError) return dbError(loadError);
  if (!schedule) {
    return NextResponse.json({ error: "日程調整が見つかりません" }, { status: 404 });
  }

  if (schedule.status !== "open") {
    return badRequest("受付を終了している日程調整は案内できません。受付を再開してください");
  }
  if (schedule.deadline && new Date(schedule.deadline).getTime() < Date.now()) {
    return badRequest("回答期限を過ぎています。期限を延ばしてから案内してください");
  }
  const hasFutureSlot = schedule.slots.some((s) => new Date(s.starts_at).getTime() > Date.now());
  if (!hasFutureSlot && !schedule.allow_other && schedule.questions.length === 0) {
    return badRequest(
      "回答してもらう項目がありません。候補の日時を追加するか、「その他」や質問を設定してください"
    );
  }

  const reward = rewards.find((r) => r.id === schedule.reward_id);
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

  const targets = roster.filter((r) =>
    !r.eligible
      ? false
      : mode === "uninvited"
        ? !r.invitedAt
        : Boolean(r.invitedAt) && !r.submittedAt && r.slotIds.length < r.tickets
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
