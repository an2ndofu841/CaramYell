import PlaceholderPage from "@/components/layout/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "プライバシーポリシー" };

export default function PrivacyPage() {
  return (
    <PlaceholderPage
      emoji="🔒"
      title="プライバシーポリシー"
      description="お客様の個人情報の取り扱いについて定めています。"
      note="公開前に正式なポリシー文を掲載します。"
    />
  );
}
