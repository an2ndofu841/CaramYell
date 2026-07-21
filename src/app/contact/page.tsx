import PlaceholderPage from "@/components/layout/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "お問い合わせ" };

export default function ContactPage() {
  return (
    <PlaceholderPage
      emoji="✉️"
      title="お問い合わせ"
      description="ご質問・ご要望はお問い合わせフォームから承ります。"
    />
  );
}
