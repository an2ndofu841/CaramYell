import PlaceholderPage from "@/components/layout/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "手数料について" };

export default function PricingPage() {
  return (
    <PlaceholderPage
      emoji="💰"
      title="手数料について"
      description="掲載者の手数料は0%。出資者側に10%が上乗せされる仕組みです。詳細ページは準備中です。"
    />
  );
}
