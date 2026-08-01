"use client";

import { useAuth } from "@/hooks/useAuth";

/**
 * 子要素を掲載権限のある人（運営が承認した creator と admin）だけに表示する。
 * プロジェクト作成の導線は一般ユーザーには見せない。
 */
export default function CreatorOnly({ children }: { children: React.ReactNode }) {
  const { isCreator, loading } = useAuth();
  if (loading || !isCreator) return null;
  return <>{children}</>;
}
