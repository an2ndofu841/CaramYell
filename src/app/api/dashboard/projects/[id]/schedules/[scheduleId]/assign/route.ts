import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { loadManagedProject, loadScheduleRoster } from "@/lib/schedule/manage";
import { confirmBookings, getServiceSupabase } from "@/lib/schedule/server";

export const maxDuration = 60;

/**
 * 支援者の希望をもとに、まだ確定していない人の日程をまとめて確定する（掲載者のみ）。
 * 回答の早い人から順に、第1希望 → 第2希望 → 第3希望の順で空いている枠に入れる。
 * すでに確定している枠はそのまま。過ぎた枠には入れない。
 * 「その他」だけの人や、希望の枠がすべて埋まっている人は残る（個別に確定する）。
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const { id, scheduleId } = await params;
  const { supabase, user, denied } = await loadManagedProject(id);
  if (denied) return denied;

  const limit = rateLimit(`schedule-assign:${user.id}`, 10, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: "サーバーの設定が不足しています" }, { status: 503 });
  }

  const { schedule, roster, error } = await loadScheduleRoster(supabase, id, scheduleId);
  if (error) return dbError(error);
  if (!schedule) {
    return NextResponse.json({ error: "日程調整が見つかりません" }, { status: 404 });
  }

  const now = Date.now();
  const left = new Map(schedule.slots.map((s) => [s.id, s.capacity]));
  for (const r of roster) {
    for (const slotId of r.slotIds) left.set(slotId, (left.get(slotId) ?? 0) - 1);
  }
  const open = (slotId: string) => {
    const slot = schedule.slots.find((s) => s.id === slotId);
    return !!slot && new Date(slot.starts_at).getTime() > now && (left.get(slotId) ?? 0) > 0;
  };

  const pending = roster
    .filter(
      (r) =>
        r.eligible &&
        r.participantId &&
        r.submittedAt &&
        r.slotIds.length < r.tickets &&
        r.preferredSlotIds.length > 0
    )
    .sort((a, b) => a.submittedAt!.localeCompare(b.submittedAt!));

  let assigned = 0;
  let failed = 0;
  // 口数ぶん確定しきれなかった人（「その他」だけの人は pending に入らないので別に数える）
  let remaining = roster.filter(
    (r) =>
      r.eligible &&
      r.participantId &&
      r.submittedAt &&
      r.slotIds.length < r.tickets &&
      r.preferredSlotIds.length === 0
  ).length;
  for (const r of pending) {
    const wanted = [...r.slotIds];
    for (const slotId of r.preferredSlotIds) {
      if (wanted.length >= r.tickets) break;
      if (wanted.includes(slotId) || !open(slotId)) continue;
      wanted.push(slotId);
    }
    if (wanted.length === r.slotIds.length) {
      remaining++;
      continue;
    }

    try {
      const result = await confirmBookings(service, r.participantId!, wanted, r.tickets);
      if (result !== "ok") {
        failed++;
        remaining++;
        continue;
      }
      for (const slotId of wanted) {
        if (!r.slotIds.includes(slotId)) left.set(slotId, (left.get(slotId) ?? 0) - 1);
      }
      assigned++;
      if (wanted.length < r.tickets) remaining++;
    } catch (err) {
      console.error("[schedule-assign]", err);
      failed++;
      remaining++;
    }
  }

  return NextResponse.json({ assigned, remaining, failed });
}
