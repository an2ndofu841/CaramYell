import type { Project } from "@/types";

/**
 * 公開ページに出す掲載者名。
 * 事務所のプロジェクトは事務所名、そうでなければ承認時の事務所名か表示名。
 */
export function publisherName(
  project: Pick<Project, "organizations" | "profiles">
): string | undefined {
  return (
    project.organizations?.name ||
    project.profiles?.organization_name ||
    project.profiles?.display_name ||
    undefined
  );
}
