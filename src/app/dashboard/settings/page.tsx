import type { Metadata } from "next";
import ProfileSettingsClient from "./ProfileSettingsClient";

export const metadata: Metadata = { title: "プロフィール設定" };

export default function SettingsPage() {
  return <ProfileSettingsClient />;
}
