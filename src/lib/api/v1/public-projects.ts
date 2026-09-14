import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { dbError } from "@/lib/api/errors";
import { withV1Cors } from "@/lib/api/v1/http";
import { PUBLIC_PROJECT_COLUMNS } from "@/lib/project/public-columns";
import { slugError } from "@/lib/project/slug";
import type { V1ProjectSource } from "@/lib/api/v1/serialize-project";

/** 公開ページと同じ。下書き・審査中は外部アプリにも出さない */
export const V1_PUBLIC_STATUSES = ["active", "funded", "completed"] as const;

export const V1_MAX_IDS = 20;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * リターンは列を明示する。select("*") だと digital_delivery_info
 * （購入者へ渡す配送用の文言）まで乗ってしまう。
 */
const V1_SELECT = `
  ${PUBLIC_PROJECT_COLUMNS},
  profiles!projects_creator_id_fkey(display_name, avatar_url),
  categories(slug, name_ja, name_en),
  rewards(id, title, description, title_en, description_en, amount, quantity_total, quantity_claimed, reward_type, estimated_delivery_date, sort_order),
  project_milestones(id, amount, title, description, sort_order)
`;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

/** 案件の公開 ID。UUID か掲載スラッグだけを受け付ける */
export function isProjectRef(value: string): boolean {
  return isUuid(value) || slugError(value) === null;
}

export function parseProjectIds(raw: string | null): {
  ids: string[];
  error?: string;
} {
  if (raw == null || raw.trim() === "") {
    return { ids: [], error: "ids を指定してください" };
  }

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { ids: [], error: "ids を指定してください" };
  }
  if (parts.length > V1_MAX_IDS) {
    return { ids: [], error: `ids は${V1_MAX_IDS}件までです` };
  }

  const seen = new Set<string>();
  const ids: string[] = [];
  for (const part of parts) {
    if (!isProjectRef(part)) {
      return { ids: [], error: "ids の形式が正しくありません" };
    }
    if (seen.has(part)) continue;
    seen.add(part);
    ids.push(part);
  }

  return { ids };
}

function createAnonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isValidUrl = !!url && /^https?:\/\//.test(url);

  return createClient(
    isValidUrl ? url! : "https://placeholder.supabase.co",
    key && key !== "your_supabase_anon_key_here" ? key : "placeholder-anon-key",
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

function publicQuery(supabase: SupabaseClient) {
  return supabase
    .from("projects")
    .select(V1_SELECT)
    .in("status", [...V1_PUBLIC_STATUSES]);
}

export async function fetchPublicProject(ref: string): Promise<
  | { project: V1ProjectSource; error?: undefined }
  | { project?: undefined; error: Response | null }
> {
  const supabase = createAnonClient();
  const query = isUuid(ref)
    ? publicQuery(supabase).eq("id", ref)
    : publicQuery(supabase).eq("slug", ref);

  const { data, error } = await query.maybeSingle();
  if (error) return { error: withV1Cors(dbError(error)) };
  if (!data) return { error: null };
  return { project: data as unknown as V1ProjectSource };
}

export async function fetchPublicProjectsByRefs(refs: string[]): Promise<
  | { projects: V1ProjectSource[]; error?: undefined }
  | { projects?: undefined; error: Response }
> {
  if (refs.length === 0) return { projects: [] };

  const supabase = createAnonClient();
  const uuids = refs.filter(isUuid);
  const slugs = refs.filter((ref) => !isUuid(ref));

  let query = publicQuery(supabase);
  if (uuids.length > 0 && slugs.length > 0) {
    query = query.or(
      `id.in.(${uuids.join(",")}),slug.in.(${slugs.join(",")})`
    );
  } else if (uuids.length > 0) {
    query = query.in("id", uuids);
  } else {
    query = query.in("slug", slugs);
  }

  const { data, error } = await query;
  if (error) return { error: withV1Cors(dbError(error)) };

  const rows = (data ?? []) as unknown as V1ProjectSource[];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  const ordered: V1ProjectSource[] = [];
  const seen = new Set<string>();
  for (const ref of refs) {
    const row = isUuid(ref) ? byId.get(ref) : bySlug.get(ref);
    if (!row || seen.has(row.id)) continue;
    seen.add(row.id);
    ordered.push(row);
  }

  return { projects: ordered };
}
