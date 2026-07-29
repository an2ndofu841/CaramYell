import BackingClient from "./BackingClient";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/types";

// 掲載中(active)の実プロジェクト＋リターンを取得（見つからなければ null → デモ扱い）
async function getRealProject(slugOrId: string): Promise<Project | null> {
  try {
    const supabase = await createClient();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        slugOrId
      );
    const query = supabase
      .from("projects")
      .select(
        `
        *,
        rewards(*),
        categories(*)
      `
      )
      .in("status", ["active"]);

    const { data } = await (isUuid
      ? query.eq("id", slugOrId)
      : query.eq("slug", slugOrId)
    ).maybeSingle();

    return (data as unknown as Project) || null;
  } catch {
    return null;
  }
}

export default async function BackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ reward?: string }>;
}) {
  const { projectId } = await params;
  const { reward } = await searchParams;

  const project = await getRealProject(projectId);

  return (
    <BackingClient
      projectSlug={projectId}
      selectedRewardId={reward}
      allowFreeAmount={project ? project.allow_free_amount !== false : true}
      realProject={project}
    />
  );
}
