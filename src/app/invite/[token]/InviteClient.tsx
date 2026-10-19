"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

type Invitation = {
  organizationName: string;
  email: string;
  role: "owner" | "staff";
  expiresAt: string;
  accepted: boolean;
  expired: boolean;
};

const ROLE_LABEL = { owner: "オーナー", staff: "スタッフ" } as const;

const primaryLink =
  "inline-flex items-center justify-center h-11 px-5 rounded-lg bg-ink text-white text-sm font-bold hover:bg-ink-soft transition-colors";
const secondaryLink =
  "inline-flex items-center justify-center h-11 px-5 rounded-lg border border-line-strong bg-white text-ink text-sm font-bold hover:bg-cream-100 transition-colors";

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-16 px-4">
      <div className="max-w-lg mx-auto rounded-xl border border-line bg-white p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}

export default function InviteClient({ token }: { token: string }) {
  const router = useRouter();
  const { user, organization, loading: authLoading, refreshProfile } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/invitations/${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "招待が見つかりません");
        setInvitation(data.invitation);
      } catch (err) {
        setError(err instanceof Error ? err.message : "招待が見つかりません");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const accept = async () => {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "招待を受けられませんでした");
      await refreshProfile();
      toast.success(`${invitation?.organizationName} に参加しました`);
      router.replace("/dashboard/projects");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "招待を受けられませんでした");
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <Loader2 size={24} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <Panel>
        <h1 className="font-bold text-ink text-lg">招待が見つかりません</h1>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">
          {error ?? "リンクをご確認ください。"}
          招待を送った方に、もう一度送ってもらうよう依頼してください。
        </p>
      </Panel>
    );
  }

  const here = `/invite/${encodeURIComponent(token)}`;
  const heading = (
    <>
      <p className="text-xs font-bold text-ink-muted">事務所への招待</p>
      <h1
        className="mt-1 text-xl font-bold text-ink"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {invitation.organizationName}
      </h1>
      <p className="mt-2 text-sm text-ink-soft leading-relaxed">
        {ROLE_LABEL[invitation.role]}として招待されています。参加すると、事務所のプロジェクトの編集や支援者の管理ができるようになります。
      </p>
    </>
  );

  let body: React.ReactNode;
  if (invitation.accepted) {
    body = (
      <p className="mt-6 text-sm text-ink-soft">
        この招待はすでに使われています。
        {organization && (
          <Link href="/dashboard/projects" className="ml-1 underline hover:text-ink">
            管理画面へ
          </Link>
        )}
      </p>
    );
  } else if (invitation.expired) {
    body = (
      <p className="mt-6 text-sm text-ink-soft leading-relaxed">
        招待の有効期限が切れています。招待を送った方に、もう一度送ってもらうよう依頼してください。
      </p>
    );
  } else if (!user) {
    body = (
      <>
        <p className="mt-6 text-sm text-ink-soft leading-relaxed">
          <span className="font-bold text-ink">{invitation.email}</span>{" "}
          のアカウントでログインして参加してください。アカウントが無い場合は作成後、メールの確認を済ませてからもう一度このリンクを開いてください。
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href={`/auth/login?redirect=${encodeURIComponent(here)}`} className={primaryLink}>
            ログインする
          </Link>
          <Link
            href={`/auth/login?mode=signup&redirect=${encodeURIComponent(here)}`}
            className={secondaryLink}
          >
            アカウントを作成する
          </Link>
        </div>
      </>
    );
  } else if (user.email?.toLowerCase() !== invitation.email) {
    body = (
      <p className="mt-6 text-sm text-ink-soft leading-relaxed">
        この招待は <span className="font-bold text-ink">{invitation.email}</span>{" "}
        宛てです。いまは {user.email} でログインしています。招待されたメールアドレスのアカウントでログインし直してください。
      </p>
    );
  } else if (organization) {
    body = (
      <p className="mt-6 text-sm text-ink-soft leading-relaxed">
        すでに「{organization.name}」に所属しています。現在は1つのアカウントで参加できる事務所は1つまでです。
      </p>
    );
  } else {
    body = (
      <div className="mt-6">
        <Button onClick={accept} loading={accepting} className="w-full sm:w-auto">
          参加する
        </Button>
      </div>
    );
  }

  return (
    <Panel>
      {heading}
      {body}
    </Panel>
  );
}
