import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { backerIdentity } from "@/lib/utils";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      categories(id, slug, name_ja, icon, color),
      rewards(id, title, amount, quantity_total, quantity_claimed, reward_type)
    `
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const projectIds = (projects || []).map((p) => p.id);

  let backerStats: Record<
    string,
    { count: number; total: number }
  > = {};

  if (projectIds.length > 0) {
    const { data: backers } = await supabase
      .from("backers")
      .select("project_id, amount, user_id, guest_email")
      .in("project_id", projectIds)
      .eq("status", "paid");

    if (backers) {
      // 同じ人の複数回の支援は1人として数える
      const grouped = new Map<string, { total: number; people: Set<string> }>();
      for (const b of backers) {
        const entry = grouped.get(b.project_id) ?? {
          total: 0,
          people: new Set<string>(),
        };
        entry.total += b.amount;
        entry.people.add(backerIdentity(b));
        grouped.set(b.project_id, entry);
      }
      backerStats = Object.fromEntries(
        [...grouped].map(([projectId, { total, people }]) => [
          projectId,
          { count: people.size, total },
        ])
      );
    }
  }

  const enrichedProjects = (projects || []).map((p) => ({
    ...p,
    live_backer_count: backerStats[p.id]?.count || p.backer_count || 0,
    live_current_amount: backerStats[p.id]?.total || p.current_amount || 0,
  }));

  return NextResponse.json({ projects: enrichedProjects });
}
