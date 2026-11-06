import { createClient } from "@/lib/supabase/server";
import { getServiceSupabase, loadBookingContext, UUID_RE } from "./server";

/**
 * ログイン中の支援者本人の日程調整か確かめて読む。
 * 支援のメールアドレスとアカウントのメールアドレスが一致する人だけ
 * （支援履歴・明細の RLS と同じ考え方）。
 */
export async function loadOwnBookingContext(participantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, service: null, ctx: null };

  const email = (user.email || "").trim().toLowerCase();
  const service = getServiceSupabase();
  if (!email || !service || !UUID_RE.test(participantId)) {
    return { user, service: null, ctx: null };
  }

  const ctx = await loadBookingContext(service, { participantId });
  if (!ctx || ctx.participant.email !== email || !ctx.participant.invited_at) {
    return { user, service: null, ctx: null };
  }
  return { user, service, ctx };
}
