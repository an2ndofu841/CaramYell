import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CreateProjectClient from "./CreateProjectClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プロジェクトを作成",
  description: "基本情報・ゴール・リターン・デザインを入力して、プロジェクトの掲載を申請します",
};

export default function CreateProjectPage() {
  // 下書きの読み戻しで useSearchParams を使うため境界が要る
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream-50">
          <Loader2 size={24} className="animate-spin text-ink-muted" />
        </div>
      }
    >
      <CreateProjectClient />
    </Suspense>
  );
}
