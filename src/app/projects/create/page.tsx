import { Suspense } from "react";
import CreateProjectClient from "./CreateProjectClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プロジェクトを作る",
  description: "AIのサポートで、最短10分でクラウドファンディングページを作れます",
};

export default function CreateProjectPage() {
  // 下書きの読み戻しで useSearchParams を使うため境界が要る
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-caramel-200 border-t-candy-pink animate-spin" />
        </div>
      }
    >
      <CreateProjectClient />
    </Suspense>
  );
}
