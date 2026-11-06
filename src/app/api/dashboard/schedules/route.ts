import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatSlotTime } from "@/lib/schedule/time";
import { getServiceSupabase, isScheduleChangeable } from "@/lib/schedule/server";

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
    .select("id, schedule_id, slot_id")
    .eq("email", email)
    .not("invited_at", "is", null);
  if (!participants || participants.length === 0) {
    return NextResponse.json({ schedules: [] });
  }

  const scheduleIds = [...new Set(participants.map((p) => p.schedule_id))];
  const slotIds = participants.map((p) => p.slot_id).filter(Boolean) as string[];
  const [{ data: schedules }, { data: slots }] = await Promise.all([
    service
      .from("reward_schedules")
      .select("id, title, deadline, status, duration_minutes, projects(id, title, slug)")
      .in("id", scheduleIds),
    slotIds.length
      ? service.from("reward_schedule_slots").select("id, starts_at").in("id", slotIds)
      : Promise.resolve({ data: [] as { id: string; starts_at: string }[] }),
  ]);

  const result = participants.flatMap((p) => {
    const s = schedules?.find((x) => x.id === p.schedule_id);
    if (!s) return [];
    const project = Array.isArray(s.projects) ? s.projects[0] : s.projects;
    const slot = slots?.find((x) => x.id === p.slot_id);
    return [
      {
        participantId: p.id,
        title: s.title,
        projectTitle: project?.title ?? "",
        bookedLabel: slot ? formatSlotTime(slot.starts_at, s.duration_minutes) : null,
        bookedAt: slot?.starts_at ?? null,
        deadline: s.deadline,
        canChange: isScheduleChangeable(s),
      },
    ];
  });

  return NextResponse.json({ schedules: result });
}
