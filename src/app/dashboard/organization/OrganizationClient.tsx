"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, UserMinus, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import DashboardShell from "../DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import type {
  OrganizationInvitation,
  OrganizationMember,
  OrganizationMembership,
  OrganizationRole,
} from "@/types";

const ROLE_LABEL: Record<OrganizationRole, string> = {
  owner: "オーナー",
  staff: "スタッフ",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const selectClass =
  "h-11 rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10";

export default function OrganizationClient() {
  const router = useRouter();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const [organization, setOrganization] = useState<OrganizationMembership | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrganizationRole>("staff");
  const [inviting, setInviting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/organization");
      if (res.status === 401) {
        router.push("/auth/login?redirect=/dashboard/organization");
        return;
      }
      const data = await res.json();
      setOrganization(data.organization ?? null);
      setMembers(data.members ?? []);
      setInvitations(data.invitations ?? []);
    } catch {
      toast.error("読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login?redirect=/dashboard/organization");
      return;
    }
    load();
  }, [user, authLoading, router, load]);

  const request = async (url: string, init: RequestInit) => {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "処理に失敗しました");
    return data;
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const data = await request("/api/dashboard/organization/invitations", {
        method: "POST",
        body: JSON.stringify({ email, role: inviteRole }),
      });
      setInvitations((prev) => [data.invitation, ...prev]);
      setEmail("");
      toast.success(`${data.invitation.email} に招待メールを送りました`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "招待に失敗しました");
    } finally {
      setInviting(false);
    }
  };

  const cancelInvitation = async (invitation: OrganizationInvitation) => {
    setBusyId(invitation.id);
    try {
      await request(`/api/dashboard/organization/invitations/${invitation.id}`, {
        method: "DELETE",
      });
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      toast.success("招待を取り消しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "取り消しに失敗しました");
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (member: OrganizationMember, role: OrganizationRole) => {
    if (role === member.role) return;
    setBusyId(member.user_id);
    try {
      await request(`/api/dashboard/organization/members/${member.user_id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setMembers((prev) =>
        prev.map((m) => (m.user_id === member.user_id ? { ...m, role } : m))
      );
      // 自分の権限を下げたときはヘッダーなどの表示も合わせる
      if (member.user_id === user?.id) {
        await refreshProfile();
        await load();
      }
      toast.success("権限を変更しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "変更に失敗しました");
    } finally {
      setBusyId(null);
    }
  };

  const removeMember = async (member: OrganizationMember) => {
    const self = member.user_id === user?.id;
    const ok = window.confirm(
      self
        ? "事務所から抜けますか？事務所のプロジェクトは管理できなくなります。"
        : `${member.display_name || member.email || "このメンバー"} を事務所から外しますか？`
    );
    if (!ok) return;

    setBusyId(member.user_id);
    try {
      await request(`/api/dashboard/organization/members/${member.user_id}`, {
        method: "DELETE",
      });
      if (self) {
        await refreshProfile();
        toast.success("事務所から抜けました");
        router.replace("/dashboard");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
      toast.success("メンバーを外しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "処理に失敗しました");
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <Loader2 size={24} className="animate-spin text-ink-muted mx-auto mb-3" />
          <p className="text-sm text-ink-muted">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!organization) {
    return (
      <DashboardShell title="事務所のメンバー" description="事務所のプロジェクトを複数のスタッフで管理できます">
        <div className="rounded-xl border border-line bg-white px-6 py-14 text-center">
          <h2
            className="text-lg font-bold text-ink mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            事務所に所属していません
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            掲載申請が承認されると事務所が作られ、スタッフを招待できるようになります。
            <br />
            招待を受けた方は、メールのリンクから参加してください。
          </p>
          <Link href="/for-agencies">
            <Button variant="outline">掲載について見る</Button>
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const isOwner = organization.role === "owner";
  const ownerCount = members.filter((m) => m.role === "owner").length;

  return (
    <DashboardShell
      title="事務所のメンバー"
      description={`${organization.name} のプロジェクトを管理するメンバー`}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8 min-w-0">
          <section>
            <h2 className="text-xs font-bold text-ink-muted mb-3">
              メンバー（{members.length}人）
            </h2>
            <ul className="rounded-xl border border-line bg-white divide-y divide-line">
              {members.map((member) => {
                const self = member.user_id === user.id;
                // 最後のオーナーは外せない（DB でも止めている）
                const lastOwner = member.role === "owner" && ownerCount <= 1;
                const canRemove = !lastOwner && (isOwner || self);
                return (
                  <li
                    key={member.user_id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink truncate">
                        {member.display_name || "（名前未設定）"}
                        {self && (
                          <span className="ml-2 text-xs font-normal text-ink-muted">あなた</span>
                        )}
                      </p>
                      <p className="text-xs text-ink-muted truncate">
                        {member.email} · {formatDate(member.joined_at)}から
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isOwner && !lastOwner ? (
                        <select
                          aria-label="権限"
                          value={member.role}
                          disabled={busyId === member.user_id}
                          onChange={(e) =>
                            changeRole(member, e.target.value as OrganizationRole)
                          }
                          className={selectClass}
                        >
                          <option value="owner">オーナー</option>
                          <option value="staff">スタッフ</option>
                        </select>
                      ) : (
                        <Badge color={member.role === "owner" ? "caramel" : "gray"} size="sm">
                          {ROLE_LABEL[member.role]}
                        </Badge>
                      )}
                      {canRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<UserMinus size={14} />}
                          loading={busyId === member.user_id}
                          onClick={() => removeMember(member)}
                        >
                          {self ? "抜ける" : "外す"}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {isOwner && invitations.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-ink-muted mb-3">招待中</h2>
              <ul className="rounded-xl border border-line bg-white divide-y divide-line">
                {invitations.map((invitation) => {
                  const expired = new Date(invitation.expires_at).getTime() < Date.now();
                  return (
                    <li
                      key={invitation.id}
                      className="flex items-center gap-3 px-4 sm:px-5 py-3"
                    >
                      <Mail size={16} className="text-ink-muted flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink truncate">{invitation.email}</p>
                        <p className="text-xs text-ink-muted">
                          {ROLE_LABEL[invitation.role]} ·{" "}
                          {expired
                            ? "期限切れ（取り消してから送り直してください）"
                            : `${formatDate(invitation.expires_at)}まで有効`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<X size={14} />}
                        loading={busyId === invitation.id}
                        onClick={() => cancelInvitation(invitation)}
                      >
                        取り消す
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {isOwner && (
            <form
              onSubmit={handleInvite}
              className="rounded-xl border border-line bg-white p-5 space-y-4"
            >
              <h2 className="font-bold text-ink">メンバーを招待</h2>
              <Input
                label="メールアドレス"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
                fullWidth
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="invite-role" className="text-sm font-bold text-ink">
                  権限
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as OrganizationRole)}
                  className={selectClass}
                >
                  <option value="staff">スタッフ</option>
                  <option value="owner">オーナー</option>
                </select>
              </div>
              <Button type="submit" loading={inviting} className="w-full">
                招待メールを送る
              </Button>
              <p className="text-xs text-ink-muted leading-relaxed">
                招待は7日間有効です。招待したメールアドレスの CaramYell アカウントでログインして参加します。
              </p>
            </form>
          )}

          <div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-soft leading-relaxed space-y-3">
            <h2 className="font-bold text-ink">権限について</h2>
            <p>
              <span className="font-bold text-ink">スタッフ</span>
              ：プロジェクトの作成・編集、支援者の確認、発送やリターンの送付、活動報告ができます。
            </p>
            <p>
              <span className="font-bold text-ink">オーナー</span>
              ：スタッフの操作に加えて、メンバーの招待・権限変更・削除と、プロジェクトの削除ができます。
            </p>
            <p className="text-xs text-ink-muted">
              事務所名の変更は
              <Link href="/contact" className="underline hover:text-ink">
                お問い合わせ
              </Link>
              から承ります。
            </p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
