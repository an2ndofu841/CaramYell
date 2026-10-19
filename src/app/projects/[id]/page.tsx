import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProjectDetailClient from "./ProjectDetailClient";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_PROJECT_COLUMNS } from "@/lib/project/public-columns";
import { Project } from "@/types";

async function getProject(slugOrId: string): Promise<Project | null> {
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
        ${PUBLIC_PROJECT_COLUMNS},
        profiles!projects_creator_id_fkey(*),
        organizations(id, name),
        categories(*),
        rewards(*),
        project_milestones(*),
        project_updates(*)
      `
      )
      .in("status", ["active", "funded", "completed"]);

    const { data } = await (isUuid
      ? query.eq("id", slugOrId)
      : query.eq("slug", slugOrId)
    ).maybeSingle();

    return (data as unknown as Project) || null;
  } catch {
    return null;
  }
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
