import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrganizationMembership, OrganizationRole } from "@/types";

/**
 * プロジェクトを管理できるのは
 * - 事務所のプロジェクト（organization_id あり）: その事務所のいまのメンバー
 * - 事務所に属さないプロジェクト: 作成者本人（creator_id）
 * RLS（032 の manages_project）と同じ判定を API 側のクエリ条件にしたもの。
 */
export type ProjectAccess = {
  userId: string;
  membership: OrganizationMembership | null;
  /** PostgREST の or() に渡す「管理できるプロジェクト」の条件 */
  filter: string;
};

/** ログイン中のユーザーが所属する事務所（当面は1人1事務所） */
export async function getMembership(
  supabase: SupabaseClient,
  userId: string
): Promise<OrganizationMembership | null> {
  const { data } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name)")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;

  const org = Array.isArray(data.organizations)
    ? data.organizations[0]
    : data.organizations;
  if (!org) return null;

  return {
    id: org.id as string,
    name: org.name as string,
    role: data.role as OrganizationRole,
  };
}

export function manageableProjectsFilter(
  userId: string,
  organizationId: string | null
): string {
  const own = `and(organization_id.is.null,creator_id.eq.${userId})`;
  return organizationId ? `${own},organization_id.eq.${organizationId}` : own;
}

export async function getProjectAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<ProjectAccess> {
  const membership = await getMembership(supabase, userId);
  return {
    userId,
    membership,
    filter: manageableProjectsFilter(userId, membership?.id ?? null),
  };
}

/**
 * `.eq("creator_id", user.id)` の置き換え。
 * `.or(await managedBy(supabase, user.id))` の形で使う。
 */
export async function managedBy(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  return (await getProjectAccess(supabase, userId)).filter;
}

/** 削除できるのは作成者本人か事務所のオーナー（RLS と同じ） */
export function canDeleteProject(
  access: ProjectAccess,
  project: { creator_id?: string | null; organization_id?: string | null }
): boolean {
  if (!project.organization_id) return project.creator_id === access.userId;
  if (access.membership?.id !== project.organization_id) return false;
  return (
    access.membership.role === "owner" || project.creator_id === access.userId
  );
}

/** 掲載できる人か（運営が承認した掲載者・管理者、または事務所のメンバー） */
export async function canPublish(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_creator", { uid: userId });
  return data === true;
}
