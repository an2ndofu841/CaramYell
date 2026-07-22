"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/auth/AuthProvider";

/**
 * アプリ全体で共有される認証状態を読む。<AuthProvider> の内側で使うこと。
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
