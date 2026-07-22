import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// ブラウザ用クライアントはシングルトンにする。
// createClient() を呼ぶたびに新しいインスタンスを作ると、gotrue の
// トークン更新ロック（Web Locks API）を複数インスタンスが奪い合い、
// "Lock broken by another request with the 'steal' option" が発生する。
let browserClient: SupabaseClient | undefined;

export function createClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 環境変数が未設定でもビルド（プリレンダー）が通るようにフォールバック
  const isValidUrl = !!url && /^https?:\/\//.test(url);

  browserClient = createBrowserClient(
    isValidUrl ? url : "https://placeholder.supabase.co",
    key && key !== "your_supabase_anon_key_here" ? key : "placeholder-anon-key"
  );
  return browserClient;
}
