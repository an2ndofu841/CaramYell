import PlaceholderPage from "@/components/layout/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "利用規約" };

export default function TermsPage() {
  return (
    <PlaceholderPage
      emoji="📜"
      title="利用規約"
      description="CaramYellをご利用いただく際の規約です。"
      note="公開前に正式な規約文を掲載します。"
    />
  );
}
