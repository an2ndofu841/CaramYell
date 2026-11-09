import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { isEmailConfigured } from "@/lib/email/digital-reward";
import { schedulePageUrl, sendScheduleConfirmations } from "@/lib/email/reward-schedule";
import { createInviteToken } from "@/lib/organization/invite-token";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { badRequest, loadManagedProject, loadScheduleRoster } from "@/lib/schedule/manage";
import { getServiceSupabase, isScheduleChangeable, UUID_RE } from "@/lib/schedule/server";

export const maxDuration = 60;

const MAX_RECIPIENTS = 1000;

/**
 * 確定した日程のお知らせを送る（掲載者のみ）。
 * 前回のお知らせから確定の内容が変わった人（新たに確定・変更・取り消し）にだけ送る。
 * メールのリンクは新しいトークンにする（前のリンクは使えなくなる）。
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const { id, scheduleId } = await params;
  const { supabase, user, project, denied } = await loadManagedProject(id);
  if (denied) return denied;

  const limit = rateLimit(`schedule-notice:${user.id}`, 10, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "メール送信の設定が完了していません。運営にお問い合わせください" },
      { status: 503 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  if (!UUID_RE.test(requestId)) return badRequest("送信IDが正しくありません");

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: "サーバーの設定が不足しています" }, { status: 503 });
  }

  const { schedule, roster, error } = await loadScheduleRoster(supabase, id, scheduleId);
  if (error) return dbError(error);
  if (!schedule) {
    return NextResponse.json({ error: "日程調整が見つかりません" }, { status: 404 });
  }

  const targets = roster.filter((r) => r.participantId && r.invitedAt && r.needsNotice);
  if (targets.length === 0) return badRequest("お知らせしていない確定の変更はありません");
  if (targets.length > MAX_RECIPIENTS) {
    return badRequest(`一度に送れるのは${MAX_RECIPIENTS}人までです。運営にお問い合わせください`);
  }

  // 先にトークンを保存してからメールを送る（メールが届いたのにリンクが無効、を避ける）
  const tokens = new Map<string, { token: string; hash: string }>();
  for (const t of targets) tokens.set(t.email, createInviteToken());
  const keyOf = (email: string) => ({
    schedule_id: scheduleId,
    project_id: id,
    email,
    token_hash: tokens.get(email)!.hash,
  });
  const { error: tokenError } = await service
    .from("reward_schedule_participants")
    .upsert(targets.map((t) => keyOf(t.email)), { onConflict: "schedule_id,email" });
  if (tokenError) return dbError(tokenError);

  const canReanswer = isScheduleChangeable(schedule);
  const slotOf = new Map(schedule.slots.map((s) => [s.id, s]));
  const { sent, failed } = await sendScheduleConfirmations(
    targets.map((t) => ({
      to: t.email,
      nickname: t.name || null,
      projectTitle: project.title || "プロジェクト",
      scheduleTitle: schedule.title,
      slots: t.slotIds
        .map((sid) => slotOf.get(sid))
        .filter((s) => s !== undefined)
        .map((s) => ({ startsAt: s.starts_at, note: s.note })),
      durationMinutes: schedule.duration_minutes,
      location: schedule.location,
      canReanswer,
      deadline: schedule.deadline,
      url: schedulePageUrl(tokens.get(t.email)!.token),
    })),
    requestId
  );

  let recordFailed = false;
  if (sent.length > 0) {
    const notifiedAt = new Date().toISOString();
    const { error: recordError } = await service.from("reward_schedule_participants").upsert(
      targets
        .filter((t) => sent.includes(t.email))
        .map((t) => ({ ...keyOf(t.email), notified_slot_ids: t.slotIds, notified_at: notifiedAt })),
      { onConflict: "schedule_id,email" }
    );
    if (recordError) {
      console.error("[schedule-notice] record failed", recordError);
      recordFailed = true;
    }

    // 取り消した人には希望を選び直してもらうので、前の希望を消して「未回答」に戻す（質問への回答は残す）
    const cancelled = targets
      .filter((t) => t.slotIds.length === 0 && sent.includes(t.email))
      .map((t) => t.email);
    if (canReanswer && cancelled.length > 0) {
      const { error: resetError } = await service
        .from("reward_schedule_participants")
        .update({ preferred_slot_ids: [], other_text: "", submitted_at: null })
        .eq("schedule_id", scheduleId)
        .in("email", cancelled);
      if (resetError) {
        console.error("[schedule-notice] reset failed", resetError);
        recordFailed = true;
      }
    }
  }

  return NextResponse.json({ sent: sent.length, failed: failed.length, recordFailed });
}
