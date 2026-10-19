"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { organizationTypeLabel } from "@/lib/config/organization-types";
import { cn, formatDate } from "@/lib/utils";
import type { CreatorApplication, CreatorApplicationStatus } from "@/types";

type AdminApplication = CreatorApplication & {
  profiles: { display_name: string | null; role: string } | null;
};

const FILTERS: { id: CreatorApplicationStatus | "all"; label: string }[] = [
  { id: "pending", label: "確認待ち" },
  { id: "approved", label: "承認済み" },
  { id: "rejected", label: "見送り" },
  { id: "all", label: "すべて" },
];

const STATUS_STYLE: Record<CreatorApplicationStatus, { label: string; className: string }> = {
  pending: { label: "確認待ち", className: "bg-amber-50 text-amber-800" },
  approved: { label: "承認済み", className: "bg-emerald-50 text-emerald-800" },
  rejected: { label: "見送り", className: "bg-cream-100 text-ink-muted" },
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AdminApplication[] | null>(null);
  const [filter, setFilter] = useState<CreatorApplicationStatus | "all">("pending");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/applications");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "取得に失敗しました");
        setApplications(data.applications ?? []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "取得に失敗しました");
        setApplications([]);
      }
    })();
  }, []);

  const counts = (applications ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});
  const visible = (applications ?? []).filter((a) => filter === "all" || a.status === filter);

  const onReviewed = (id: string, patch: Partial<AdminApplication>) =>
    setApplications((prev) => prev?.map((a) => (a.id === id ? { ...a, ...patch } : a)) ?? null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">掲載申請</h1>
      <p className="text-sm text-ink-muted mb-6">
        事務所・レーベルからの掲載申請。承認すると申請者が掲載者になり、事務所名がプロジェクトに表示されます。
      </p>

      <div className="flex gap-1 mb-6 border-b border-line">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-3 py-2 -mb-px text-sm border-b-2 transition-colors",
              filter === f.id
                ? "border-ink text-ink font-bold"
                : "border-transparent text-ink-muted hover:text-ink"
            )}
          >
            {f.label}
            {f.id !== "all" && counts[f.id] ? (
              <span className="ml-1.5 text-xs tabular-nums">{counts[f.id]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {applications === null ? (
        <div className="py-16 flex justify-center">
          <Loader2 size={24} className="animate-spin text-ink-muted" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-line bg-white py-16 text-center text-sm text-ink-muted">
          該当する申請はありません
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((a) => (
            <ApplicationCard key={a.id} application={a} onReviewed={onReviewed} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({
  application: a,
  onReviewed,
}: {
  application: AdminApplication;
  onReviewed: (id: string, patch: Partial<AdminApplication>) => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const status = STATUS_STYLE[a.status];

  const review = async (action: "approve" | "reject") => {
    const confirmText =
      action === "approve"
        ? `「${a.organization_name}」を承認し、掲載者にしますか？`
        : `「${a.organization_name}」の申請を見送りますか？`;
    if (!window.confirm(confirmText)) return;

    setBusy(action);
    try {
      const res = await fetch(`/api/admin/applications/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "更新に失敗しました");
      onReviewed(a.id, data.application);
      toast.success(action === "approve" ? "承認しました" : "見送りにしました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className="rounded-xl border border-line bg-white">
      <header className="px-5 sm:px-6 py-4 border-b border-line flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={cn("px-2 py-0.5 rounded-md text-xs font-bold", status.className)}>
          {status.label}
        </span>
        <h2 className="font-bold text-ink">{a.organization_name}</h2>
        <span className="text-xs text-ink-muted">
          {organizationTypeLabel(a.organization_type)} ・ {formatDate(a.created_at)}
        </span>
      </header>

      <div className="px-5 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <dl className="text-sm space-y-3">
          <Item label="ご担当者">{a.contact_name}</Item>
          <Item label="メール">
            <a href={`mailto:${a.contact_email}`} className="underline underline-offset-2 break-all">
              {a.contact_email}
            </a>
          </Item>
          {a.phone && <Item label="電話">{a.phone}</Item>}
          {a.website_url && (
            <Item label="Web">
              <a
                href={a.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline underline-offset-2 break-all"
              >
                {a.website_url}
                <ExternalLink size={12} />
              </a>
            </Item>
          )}
          <Item label="アカウント">
            {a.profiles?.display_name || "（表示名なし）"}
            {a.profiles?.role && a.profiles.role !== "user" && (
              <span className="ml-1 text-xs text-ink-muted">（{a.profiles.role}）</span>
            )}
          </Item>
          {a.expected_start && <Item label="開始時期">{a.expected_start}</Item>}
        </dl>

        <div className="lg:col-span-2 space-y-5 text-sm">
          {a.artists && (
            <div>
              <p className="text-xs font-bold text-ink-muted mb-1">所属アーティスト・活動内容</p>
              <p className="text-ink whitespace-pre-wrap leading-relaxed">{a.artists}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-ink-muted mb-1">予定している企画</p>
            <p className="text-ink whitespace-pre-wrap leading-relaxed">{a.plan}</p>
          </div>
          {a.review_note && a.status !== "pending" && (
            <div className="rounded-lg bg-cream-100 p-3">
              <p className="text-xs font-bold text-ink-muted mb-1">申請者への連絡</p>
              <p className="text-ink whitespace-pre-wrap">{a.review_note}</p>
            </div>
          )}
        </div>
      </div>

      {a.status === "pending" && (
        <footer className="px-5 sm:px-6 py-4 border-t border-line bg-cream-50 rounded-b-xl space-y-3">
          <Textarea
            rows={2}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="申請者への連絡（任意）。申請ページに表示されます"
          />
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              loading={busy === "reject"}
              disabled={busy !== null}
              onClick={() => review("reject")}
            >
              見送る
            </Button>
            <Button
              size="sm"
              loading={busy === "approve"}
              disabled={busy !== null}
              onClick={() => review("approve")}
            >
              承認して掲載者にする
            </Button>
          </div>
        </footer>
      )}
    </article>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] gap-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-ink min-w-0">{children}</dd>
    </div>
  );
}
