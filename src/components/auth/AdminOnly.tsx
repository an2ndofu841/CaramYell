"use client";

import { useAuth } from "@/hooks/useAuth";

/**
 * 子要素を管理者（弊社アカウント）のみに表示するためのラッパー。
 * プロジェクト作成の導線は一般ユーザーには非表示にする。
 */
export default function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading || !isAdmin) return null;
  return <>{children}</>;
}
