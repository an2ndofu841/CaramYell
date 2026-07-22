import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProjectDetailClient from "./ProjectDetailClient";
import { createClient } from "@/lib/supabase/server";
import { getMockProjectBySlug } from "@/lib/data/mockProjects";
import { Project } from "@/types";

async function getProject(slugOrId: string): Promise<Project | null> {
  // 1. Supabase の実データ（ダッシュボードで作成したプロジェクト）を優先
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
        profiles!projects_creator_id_fkey(*),
        categories(*),
        rewards(*),
        project_milestones(*)
      `
      )
      .in("status", ["active", "funded", "completed"]);

    const { data } = await (isUuid
      ? query.eq("id", slugOrId)
      : query.eq("slug", slugOrId)
    ).maybeSingle();

    if (data) {
      return data as unknown as Project;
    }
  } catch {
    // Supabase未設定などの場合はモックにフォールバック
  }

  // 2. デモ用モックデータ
  return getMockProjectBySlug(slugOrId);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return { title: "プロジェクトが見つかりません" };
  return {
    title: project.title,
    description: project.tagline,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} />;
}
