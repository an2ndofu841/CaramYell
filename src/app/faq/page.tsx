import PlaceholderPage from "@/components/layout/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "よくある質問" };

export default function FaqPage() {
  return (
    <PlaceholderPage
      emoji="❓"
      title="よくある質問"
      description="CaramYellの使い方やよくあるご質問をまとめます。"
    />
  );
}
