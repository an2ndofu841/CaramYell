"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ORGANIZATION_TYPES, organizationTypeLabel } from "@/lib/config/organization-types";
import { cn, formatDate } from "@/lib/utils";
import type { CreatorApplication, OrganizationType } from "@/types";

type FormState = {
  organizationName: string;
  organizationType: OrganizationType | "";
  contactName: string;
  contactEmail: string;
  phone: string;
  websiteUrl: string;
  artists: string;
  plan: string;
  expectedStart: string;
};

const EMPTY: FormState = {
  organizationName: "",
  organizationType: "",
  contactName: "",
  contactEmail: "",
  phone: "",
  websiteUrl: "",
  artists: "",
  plan: "",
  expectedStart: "",
};

export default function ApplyClient() {
  const { user, isCreator, loading: authLoading, refreshProfile } = useAuth();
  const [applications, setApplications] = useState<CreatorApplication[] | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [reapplying, setReapplying] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm((f) => (f.contactEmail ? f : { ...f, contactEmail: user.email ?? "" }));
    (async () => {
      try {
        const res = await fetch("/api/creator-applications");
        const data = await res.json();
        setApplications(res.ok ? data.applications ?? [] : []);
      } catch {
        setApplications([]);
      }
    })();
  }, [user]);

  // 承認されていれば権限を取り直す（承認後に初めて開いたとき、ヘッダー等の表示を揃える）
  const latest = applications?.[0] ?? null;
  useEffect(() => {
    if (latest?.status === "approved" && !isCreator) refreshProfile();
  }, [latest?.status, isCreator, refreshProfile]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/creator-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "送信に失敗しました");
      setApplications((prev) => [data.application, ...(prev ?? [])]);
      setReapplying(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success("申し込みを受け付けました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  let body: React.ReactNode;
  if (authLoading || (user && applications === null)) {
    body = (
      <div className="py-24 flex justify-center">
        <Loader2 size={24} className="animate-spin text-ink-muted" />
      </div>
    );
  } else if (!user) {
    body = (
      <Panel>
        <h2 className="font-bold text-ink text-lg">はじめにアカウントを作成してください</h2>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">
          申し込みは CaramYell のアカウントにひも付けて受け付けます。承認されると、そのアカウントでプロジェクトを作成・管理できるようになります。
          事務所の代表アドレスなど、継続して使うメールアドレスでの登録をおすすめします。
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/auth/login?mode=signup&redirect=/apply"
            className="inline-flex items-center justify-center h-11 px-5 rounded-full text-sm font-bold btn-caramel"
          >
            アカウントを作成する
          </Link>
          <Link
            href="/auth/login?redirect=/apply"
            className="inline-flex items-center justify-center h-11 px-5 rounded-lg border border-line-strong bg-white text-ink text-sm font-bold hover:bg-cream-100 transition-colors"
          >
            ログインする
          </Link>
        </div>
      </Panel>
    );
  } else if (isCreator) {
    body = (
      <Panel>
        <h2 className="font-bold text-ink text-lg">このアカウントは掲載できる状態です</h2>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">
          管理画面からプロジェクトを作成できます。作成したプロジェクトは、運営の確認を経て公開されます。
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/projects/create"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-sm font-bold btn-caramel"
          >
            プロジェクトを作成する
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center justify-center h-11 px-5 rounded-lg border border-line-strong bg-white text-ink text-sm font-bold hover:bg-cream-100 transition-colors"
          >
            掲載中のプロジェクト
          </Link>
        </div>
      </Panel>
    );
  } else if (latest?.status === "pending") {
    body = <ApplicationStatus application={latest} />;
  } else if (latest?.status === "rejected" && !reapplying) {
    body = (
      <ApplicationStatus
        application={latest}
        action={
          <Button variant="outline" onClick={() => setReapplying(true)}>
            内容を見直して再度申し込む
          </Button>
        }
      />
    );
  } else {
    body = (
      <form onSubmit={submit} className="space-y-10">
        <Fieldset title="事務所・団体について">
          <Input
            label="事務所・団体名"
            required
            maxLength={100}
            value={form.organizationName}
            onChange={(e) => set("organizationName", e.target.value)}
            hint="承認後、プロジェクトページに掲載者名として表示されます"
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-ink">
              団体の種別<Required />
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ORGANIZATION_TYPES.map((t) => (
                <label
                  key={t.id}
                  className={cn(
                    "flex items-center gap-3 h-11 px-3.5 rounded-lg border cursor-pointer text-sm transition-colors",
                    form.organizationType === t.id
                      ? "border-ink bg-white text-ink font-bold"
                      : "border-line-strong bg-white text-ink-soft hover:border-ink-faint"
                  )}
                >
                  <input
                    type="radio"
                    name="organizationType"
                    value={t.id}
                    required
                    checked={form.organizationType === t.id}
                    onChange={() => set("organizationType", t.id)}
                    className="accent-[#A85D22]"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
          <Input
            label="Webサイト・SNS"
            type="url"
            maxLength={500}
            placeholder="https://"
            value={form.websiteUrl}
            onChange={(e) => set("websiteUrl", e.target.value)}
            hint="公式サイトや公式 X（Twitter）など、活動が分かるページ"
          />
          <Textarea
            label="所属アーティスト・活動内容"
            rows={4}
            maxLength={2000}
            value={form.artists}
            onChange={(e) => set("artists", e.target.value)}
            placeholder="例）アイドルグループ〇〇（5人組）、ソロアーティスト〇〇 など"
          />
        </Fieldset>

        <Fieldset title="ご担当者">
          <Input
            label="お名前"
            required
            maxLength={100}
            value={form.contactName}
            onChange={(e) => set("contactName", e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="メールアドレス"
              type="email"
              required
              maxLength={254}
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              hint="審査結果はこのアドレスにお送りします"
            />
            <Input
              label="電話番号"
              type="tel"
              maxLength={30}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              hint="任意"
            />
          </div>
        </Fieldset>

        <Fieldset title="予定している企画">
          <Textarea
            label="企画の内容"
            required
            rows={6}
            maxLength={4000}
            value={form.plan}
            onChange={(e) => set("plan", e.target.value)}
            placeholder="例）〇月〇日の生誕祭に向けて、フラワースタンドと記念グッズの制作費を募りたい。目標金額は〇〇円程度を想定。"
            hint="どのアーティストの、どんな企画か。目標金額やリターンの案があれば書いてください"
          />
          <Input
            label="掲載を始めたい時期"
            maxLength={100}
            value={form.expectedStart}
            onChange={(e) => set("expectedStart", e.target.value)}
            placeholder="例）11月上旬"
            hint="任意"
          />
        </Fieldset>

        <div className="pt-2 border-t border-line flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 pt-6">
          <p className="text-xs text-ink-muted leading-relaxed">
            送信すると、
            <Link href="/terms" className="underline underline-offset-2 hover:text-ink">利用規約</Link>
            と
            <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">プライバシーポリシー</Link>
            に同意したものとみなします。
          </p>
          <Button type="submit" size="lg" loading={submitting}>
            申し込む
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="pt-28 pb-tabbar sm:pt-36">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <p className="eyebrow mb-4">For agencies &amp; labels</p>
        <h1
          className="text-3xl sm:text-4xl font-bold text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          掲載のお申し込み
        </h1>
        <p className="mt-4 text-[15px] text-ink-soft leading-relaxed">
          芸能事務所・レーベル・運営チームの方からの掲載を受け付けています。
          内容を確認のうえ、ご登録のメールアドレスに結果をご連絡します。
          掲載の仕組みは
          <Link href="/for-agencies" className="font-bold text-ink underline underline-offset-2 hover:text-caramel-600">
            事務所・レーベルの方へ
          </Link>
          をご覧ください。
        </p>
        <div className="mt-10">{body}</div>
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-line bg-white p-6 sm:p-8">{children}</div>;
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="text-xs font-bold text-ink-muted tracking-wide mb-4">{title}</legend>
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

function Required() {
  return <span className="ml-1 text-xs font-bold text-caramel-600">必須</span>;
}

function ApplicationStatus({
  application,
  action,
}: {
  application: CreatorApplication;
  action?: React.ReactNode;
}) {
  const pending = application.status === "pending";
  return (
    <Panel>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "px-2 py-1 rounded-md text-xs font-bold",
            pending ? "bg-amber-50 text-amber-800" : "bg-cream-100 text-ink-muted"
          )}
        >
          {pending ? "確認中" : "今回は見送り"}
        </span>
        <span className="text-xs text-ink-muted">{formatDate(application.created_at)} に申し込み</span>
      </div>
      <h2 className="mt-4 font-bold text-ink text-lg">
        {pending
          ? "申し込みを受け付けました"
          : "今回は掲載を見送らせていただきました"}
      </h2>
      <p className="mt-2 text-sm text-ink-soft leading-relaxed">
        {pending
          ? `運営が内容を確認しています。結果は ${application.contact_email} にお送りします。`
          : "内容を見直して、もう一度お申し込みいただけます。"}
      </p>
      {application.review_note && (
        <div className="mt-5 rounded-lg bg-cream-100 p-4">
          <p className="text-xs font-bold text-ink-muted mb-1">運営からの連絡</p>
          <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{application.review_note}</p>
        </div>
      )}
      <dl className="mt-6 pt-5 border-t border-line grid grid-cols-1 sm:grid-cols-3 gap-y-3 text-sm">
        <dt className="text-ink-muted">事務所・団体名</dt>
        <dd className="sm:col-span-2 text-ink font-medium">{application.organization_name}</dd>
        <dt className="text-ink-muted">種別</dt>
        <dd className="sm:col-span-2 text-ink">
          {organizationTypeLabel(application.organization_type)}
        </dd>
        <dt className="text-ink-muted">ご担当者</dt>
        <dd className="sm:col-span-2 text-ink">{application.contact_name}</dd>
      </dl>
      {action && <div className="mt-6">{action}</div>}
    </Panel>
  );
}
