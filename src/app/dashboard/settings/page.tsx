import PlaceholderPage from "@/components/layout/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "プロフィール設定" };

export default function SettingsPage() {
  return (
    <PlaceholderPage
      emoji="⚙️"
      title="プロフィール設定"
      description="表示名やアバターなどのプロフィール編集機能です。"
    />
  );
}
