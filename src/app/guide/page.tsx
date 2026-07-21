import PlaceholderPage from "@/components/layout/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "ガイド" };

export default function GuidePage() {
  return (
    <PlaceholderPage
      emoji="📖"
      title="ガイド"
      description="プロジェクトの始め方や応援の方法をご案内します。"
    />
  );
}
