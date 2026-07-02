import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 環境変数が未設定でもビルド（プリレンダー）が通るようにフォールバック
  const isValidUrl = !!url && /^https?:\/\//.test(url);

  return createBrowserClient(
    isValidUrl ? url : "https://placeholder.supabase.co",
    key && key !== "your_supabase_anon_key_here" ? key : "placeholder-anon-key"
  );
}
