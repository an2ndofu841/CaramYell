import type { Metadata } from "next";
import SchedulePicker from "@/components/schedule/SchedulePicker";
import SchedulePreviewNotice from "./SchedulePreviewNotice";

export const metadata: Metadata = {
  title: "日程調整",
  robots: { index: false, follow: false },
};

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // 掲載者のテスト送信に入るリンク。実際の回答画面ではない
  if (token === "preview") return <SchedulePreviewNotice />;
  return <SchedulePicker endpoint={`/api/schedule/${encodeURIComponent(token)}`} />;
}
