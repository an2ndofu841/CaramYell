"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, MailCheck, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Logo from "@/components/layout/Logo";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/components/i18n/LocaleProvider";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { needsSecondFactor } from "@/lib/auth/mfa";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));

  const {
    user,
    loading: authLoading,
    signInWithEmail,
    signUpWithEmail,
    resendSignUpEmail,
  } = useAuth();

  // ヘッダーの「新規登録」から来た人を登録タブで迎える
  const [isLogin, setIsLogin] = useState(
    searchParams.get("mode") !== "signup"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  /** 登録直後の確認待ち。セットされている間はフォームではなく案内画面を出す */
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  /** 二段階認証へ送る直前。下のログイン済み判定に横取りされないようにする */
  const [leavingForMfa, setLeavingForMfa] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "link_expired") {
      toast.error(
        "確認リンクの有効期限が切れているか、既に使われています。もう一度お試しください。"
      );
    } else if (error === "auth_failed") {
      toast.error("ログインに失敗しました。もう一度お試しください。");
    }
  }, [searchParams]);

  // ログイン済みの人をログイン画面に留めない。
  // メールのリンクや別タブでセッションが張られた場合もここで拾う
  useEffect(() => {
    if (!authLoading && user && !pendingEmail && !leavingForMfa) {
      router.replace(redirectTo);
    }
  }, [user, authLoading, pendingEmail, leavingForMfa, redirectTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signInWithEmail(form.email, form.password);
        if (error) {
          toast.error(
            error.message === "Email not confirmed"
              ? "メールアドレスの確認が済んでいません。確認メールのリンクを開いてください。"
              : error.message === "Invalid login credentials"
                ? "メールアドレスまたはパスワードが正しくありません"
                : error.message
          );
          return;
        }
        if (await needsSecondFactor()) {
          setLeavingForMfa(true);
          router.push(`/auth/mfa?next=${encodeURIComponent(redirectTo)}`);
          return;
        }
        toast.success("ログインしました");
        router.push(redirectTo);
        return;
      }

      if (form.password.length < 8) {
        toast.error("パスワードは8文字以上にしてください");
        return;
      }

      const outcome = await signUpWithEmail(form.email, form.password);
      switch (outcome.result) {
        case "signed_in":
          toast.success("アカウントを作成しました");
          router.push(redirectTo);
          break;
        case "already_registered":
          toast.error("このメールアドレスは既に登録されています。ログインしてください。");
          setIsLogin(true);
          setForm((p) => ({ ...p, password: "" }));
          break;
        case "confirm_email":
          setPendingEmail(form.email);
          break;
        case "error":
          toast.error(outcome.message);
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setIsLoading(true);
    try {
      const { error } = await resendSignUpEmail(pendingEmail);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("確認メールを再送しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const backToForm = () => {
    setPendingEmail(null);
    setIsLogin(true);
    setForm((p) => ({ ...p, password: "" }));
  };

  if (pendingEmail) {
    return (
      <ConfirmEmailNotice
        email={pendingEmail}
        isLoading={isLoading}
        onResend={handleResend}
        onBack={backToForm}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Logo className="text-ink text-[22px] mb-6" />
          <h1
            className="text-2xl font-bold text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isLogin ? t.auth.tabLogin : t.auth.tabSignup}
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            {isLogin ? t.auth.loginTo : t.auth.signupTo}
          </p>
        </div>

        <div className="rounded-xl border border-line bg-white p-6 sm:p-8">
          <div className="flex gap-1 mb-6 border-b border-line">
            {[t.auth.tabLogin, t.auth.tabSignup].map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => setIsLogin(i === 0)}
                className={`px-3 py-2 -mb-px text-sm border-b-2 transition-colors ${
                  isLogin === (i === 0)
                    ? "border-ink text-ink font-bold"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t.auth.email}
              type="email"
              placeholder="caramel@example.com"
              value={form.email}
              onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              icon={<Mail size={16} />}
              fullWidth
              required
            />

            <Input
              label={t.auth.password}
              type={showPassword ? "text" : "password"}
              placeholder={t.auth.passwordPlaceholder}
              value={form.password}
              onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
              icon={<Lock size={16} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-ink-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              fullWidth
              required
            />

            {isLogin && (
              <div className="text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-ink-soft hover:text-ink underline underline-offset-2"
                >
                  {t.auth.forgot}
                </Link>
              </div>
            )}

            <Button fullWidth size="lg" loading={isLoading} type="submit">
              {isLogin ? t.auth.loginButton : t.auth.signupButton}
            </Button>
          </form>

          <p className="text-xs text-ink-muted leading-relaxed mt-6">
            {t.auth.agreeNote1}
            <Link href="/terms" className="text-ink underline underline-offset-2">{t.auth.terms}</Link>
            {t.auth.agreeNote2}
            <Link href="/privacy" className="text-ink underline underline-offset-2">{t.auth.privacy}</Link>
            {t.auth.agreeNote3}
          </p>
        </div>

        <div className="mt-6 text-sm text-ink-muted">
          <p>{t.auth.canBackWithoutAccount}</p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 mt-1 font-bold text-ink hover:text-caramel-600 transition-colors"
          >
            {t.common.viewProjects}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ConfirmEmailNotice({
  email,
  isLoading,
  onResend,
  onBack,
}: {
  email: string;
  isLoading: boolean;
  onResend: () => void;
  onBack: () => void;
}) {
  const t = useT();

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-white p-6 sm:p-8">
        <MailCheck size={24} className="text-ink-muted mb-4" />

        <h1
          className="text-xl font-bold text-ink mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t.auth.confirmTitle}
        </h1>
        <p className="text-sm text-ink-soft leading-relaxed mb-4">{t.auth.confirmBody}</p>

        <p className="px-4 py-3 rounded-lg bg-cream-100 text-sm font-bold text-ink break-all mb-4">
          {email}
        </p>

        <p className="text-xs text-ink-muted leading-relaxed mb-6">{t.auth.confirmSpamNote}</p>

        <Button fullWidth size="lg" loading={isLoading} onClick={onResend}>
          {t.auth.confirmResend}
        </Button>

        <button
          onClick={onBack}
          className="mt-4 w-full text-center text-sm text-ink-soft hover:text-ink font-semibold"
        >
          {t.auth.confirmBackToLogin}
        </button>
      </div>
    </div>
  );
}
