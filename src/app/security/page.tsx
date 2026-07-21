import PlaceholderPage from "@/components/layout/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "セキュリティ" };

export default function SecurityPage() {
  return (
    <PlaceholderPage
      emoji="🛡️"
      title="セキュリティ"
      description="お客様の情報と決済を守るための取り組みをご紹介します。"
    />
  );
}
