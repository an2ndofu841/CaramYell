import PlaceholderPage from "@/components/layout/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "特定商取引法に基づく表記" };

export default function CommercialPage() {
  return (
    <PlaceholderPage
      emoji="📋"
      title="特定商取引法に基づく表記"
      description="事業者情報や取引条件に関する法定表記です。"
      note="公開前に正式な表記を掲載します。"
    />
  );
}
