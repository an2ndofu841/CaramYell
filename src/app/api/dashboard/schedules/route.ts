import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatSlotTime } from "@/lib/schedule/time";
import {
  countTickets,
  getServiceSupabase,
  isScheduleChangeable,
} from "@/lib/schedule/server";

/**
 * ログイン中の支援者あての日程調整の一覧（マイページ用）。
 * 案内メールを送った分だけを、アカウントのメールアドレスで拾う。
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const email = (user.email || "").trim().toLowerCase();
  const service = getServiceSupabase();
  if (!email || !service) return NextResponse.json({ schedules: [] });

  const { data: participants } = await service
    .from("reward_schedule_participants")
    .select("id, schedule_id, submitted_at")
    .eq("email", email)
    .not("invited_at", "is", null);
  if (!participants || participants.length === 0) {
    return NextResponse.json({ schedules: [] });
  }

  const scheduleIds = [...new Set(participants.map((p) => p.schedule_id))];
  const [{ data: schedules }, { data: bookings }] = await Promise.all([
    service
      .from("reward_schedules")
      .select(
        "id, project_id, reward_id, title, deadline, status, duration_minutes, projects(id, title, slug)"
      )
      .in("id", scheduleIds),
    service
      .from("reward_schedule_bookings")
      .select("participant_id, reward_schedule_slots(starts_at)")
      .in(
        "participant_id",
        participants.map((p) => p.id)
      ),
  ]);

  const result = await Promise.all(
    participants.map(async (p) => {
      const s = schedules?.find((x) => x.id === p.schedule_id);
      if (!s) return null;
      const project = Array.isArray(s.projects) ? s.projects[0] : s.projects;
      const starts = (bookings || [])
        .filter((b) => b.participant_id === p.id)
        .map((b) => {
          const slot = Array.isArray(b.reward_schedule_slots)
            ? b.reward_schedule_slots[0]
            : b.reward_schedule_slots;
          return slot?.starts_at as string | undefined;
        })
        .filter((v): v is string => Boolean(v))
        .sort();
      return {
        participantId: p.id,
        title: s.title,
        projectTitle: project?.title ?? "",
        bookedLabels: starts.map((t) => formatSlotTime(t, s.duration_minutes)),
        answered: Boolean(p.submitted_at),
        tickets: await countTickets(service, s.project_id, s.reward_id, email),
        deadline: s.deadline,
        canChange: isScheduleChangeable(s),
      };
    })
  );

  return NextResponse.json({ schedules: result.filter(Boolean) });
}
