import type { SupabaseClient } from "@supabase/supabase-js";
import type { Backer } from "@/types";

const PAGE_SIZE = 1000;

/**
 * プロジェクトの支払済みの支援を、リターンの展開に必要な明細ごと集める。
 * 既定の上限（1000行）を超える支援があっても取りこぼさないよう、ページを送って集める。
 */
export async function loadPaidBackers(supabase: SupabaseClient, projectId: string) {
  const all: Backer[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("backers")
      .select(
        `
        id, reward_id, guest_email, guest_nickname, amount, status, created_at,
        rewards(id, title, reward_type),
        backer_items(id, reward_id, reward_title, unit_amount, quantity, needs_address)
      `
      )
      .eq("project_id", projectId)
      .eq("status", "paid")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return { backers: null, error };
    all.push(...((data || []) as unknown as Backer[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return { backers: all, error: null };
}
