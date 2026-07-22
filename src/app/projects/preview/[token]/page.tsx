import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProjectDetailClient from "../../[id]/ProjectDetailClient";
import { createClient } from "@/lib/supabase/server";
import { Project } from "@/types";

async function getProjectByToken(token: string): Promise<Project | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_project_by_preview_token", {
      p_token: token,
    });
    if (error || !data) return null;
    return data as unknown as Project;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "プレビュー（未公開）",
  robots: { index: false, follow: false },
};

export default async function ProjectPreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const project = await getProjectByToken(token);

  if (!project) {
    notFound();
  }

  return (
    <>
      {/* プレビュー用の告知バー */}
      <div
        className="fixed top-0 left-0 right-0 z-[60] text-center text-sm font-bold text-white py-2 px-4"
        style={{ background: "linear-gradient(135deg, #F2807B, #E8842C)" }}
      >
        👀 これはプレビューです（まだ公開されていません） · ステータス: {project.status}
      </div>
      <div className="pt-9">
        <ProjectDetailClient project={project} isPreview />
      </div>
    </>
  );
}
