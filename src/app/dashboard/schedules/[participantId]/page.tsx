import type { Metadata } from "next";
import SchedulePicker from "@/components/schedule/SchedulePicker";

export const metadata: Metadata = {
  title: "日程調整",
  robots: { index: false, follow: false },
};

export default async function DashboardSchedulePage({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const { participantId } = await params;
  return (
    <SchedulePicker
      endpoint={`/api/dashboard/schedules/${encodeURIComponent(participantId)}`}
      backHref="/dashboard"
      backLabel="マイページに戻る"
    />
  );
}
