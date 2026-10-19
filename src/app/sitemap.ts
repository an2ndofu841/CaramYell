import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/config/site";
import { createClient } from "@supabase/supabase-js";

const staticPaths = [
  { path: "/", priority: 1 },
  { path: "/projects", priority: 0.9 },
  { path: "/about", priority: 0.8 },
  { path: "/for-agencies", priority: 0.7 },
  { path: "/pricing", priority: 0.7 },
  { path: "/guide", priority: 0.6 },
  { path: "/faq", priority: 0.6 },
  { path: "/contact", priority: 0.5 },
  { path: "/terms", priority: 0.3 },
  { path: "/privacy", priority: 0.3 },
  { path: "/commercial", priority: 0.3 },
];

/**
 * 公開中のプロジェクト。以前はデモ用のモックを載せていたが、実在しない
 * プロジェクトを検索エンジンに案内してしまうので、DB の公開分だけにする。
 * Cookie に依存しない匿名クライアントで読む（RLS で公開ステータスのみ見える）。
 */
async function publishedProjects(): Promise<{ slug: string; updated_at: string }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !/^https?:\/\//.test(url)) return [];
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase
      .from("projects")
      .select("slug, updated_at")
      .in("status", ["active", "funded", "completed"]);
    return data ?? [];
  } catch {
    return [];
  }
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const projects = await publishedProjects();

  return [
    ...staticPaths.map(({ path, priority }) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority,
    })),
    ...projects.map((project) => ({
      url: absoluteUrl(`/projects/${project.slug}`),
      lastModified: new Date(project.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
