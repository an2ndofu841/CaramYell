import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-guard";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const countBy = async (status: string) => {
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
    return count ?? 0;
  };

  const [reviewing, active, funded, completed, draft] = await Promise.all([
    countBy("reviewing"),
    countBy("active"),
    countBy("funded"),
    countBy("completed"),
    countBy("draft"),
  ]);

  const { count: usersCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  // 流通総額（掲載中/達成/完了の現在額合計）
  const { data: liveProjects } = await supabase
    .from("projects")
    .select("current_amount, backer_count")
    .in("status", ["active", "funded", "completed"]);

  const gmv = (liveProjects || []).reduce(
    (s, p) => s + (p.current_amount || 0),
    0
  );
  const totalBackers = (liveProjects || []).reduce(
    (s, p) => s + (p.backer_count || 0),
    0
  );

  return NextResponse.json({
    stats: {
      reviewing,
      active,
      funded,
      completed,
      draft,
      users: usersCount ?? 0,
      gmv,
      totalBackers,
    },
  });
}
