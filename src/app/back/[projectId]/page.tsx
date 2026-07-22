import BackingClient from "./BackingClient";
import { createClient } from "@/lib/supabase/server";

async function getAllowFreeAmount(slugOrId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        slugOrId
      );
    const query = supabase.from("projects").select("allow_free_amount");
    const { data } = await (isUuid
      ? query.eq("id", slugOrId)
      : query.eq("slug", slugOrId)
    ).maybeSingle();
    // 実データがあればその設定に従う。無い場合（モック等）はデフォルト true。
    if (data) return data.allow_free_amount !== false;
  } catch {
    // Supabase未設定などはデフォルト許可
  }
  return true;
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
  const allowFreeAmount = await getAllowFreeAmount(projectId);

  return (
    <BackingClient
      projectSlug={projectId}
      selectedRewardId={reward}
      allowFreeAmount={allowFreeAmount}
    />
  );
}
