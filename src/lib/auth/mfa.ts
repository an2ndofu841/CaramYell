import { createClient } from "@/lib/supabase/client";

/**
 * 認証アプリを登録済みなのに、いまのセッションがまだそれを通っていない状態か。
 * nextLevel は「このユーザーが到達しうる最上位」なので、未登録の人では
 * aal1 のままになり、ここは false を返す。
 */
export async function needsSecondFactor(): Promise<boolean> {
  const supabase = createClient();
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return false;
  return data.nextLevel === "aal2" && data.currentLevel !== "aal2";
}
