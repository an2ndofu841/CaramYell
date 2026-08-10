"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, MailCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Card from "@/components/ui/Card";
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
        toast.success("ログインしました！");
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
          toast.success("アカウントを作成しました！");
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
    <div
      className="min-h-screen flex items-center justify-center pt-20 pb-12 px-4"
      style={{ background: "linear-gradient(135deg, #FFFBF5 0%, #FFF5E6 100%)" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-20"
          style={{ background: "linear-gradient(135deg, #F2807B, #F5A34B)" }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-48 h-48 rounded-full opacity-15"
          style={{ background: "linear-gradient(135deg, #8FD4C4, #A8D8CB)" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div
            className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-candy"
            style={{ background: "linear-gradient(135deg, #F2807B, #F5A34B)", fontFamily: "var(--font-display)" }}
          >
            C
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isLogin ? t.auth.welcomeBack : t.auth.hello}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isLogin ? t.auth.loginTo : t.auth.signupTo}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <div className="flex p-1 bg-caramel-50 rounded-2xl mb-6">
              {[t.auth.tabLogin, t.auth.tabSignup].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setIsLogin(i === 0)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isLogin === (i === 0)
                      ? "text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={
                    isLogin === (i === 0)
                      ? { background: "linear-gradient(135deg, #F2807B, #F5A34B)" }
                      : {}
                  }
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
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                fullWidth
                required
              />

              {isLogin && (
                <div className="text-right">
                  <Link href="/auth/forgot-password" className="text-xs text-caramel-500 hover:text-caramel-600 font-semibold">
                    {t.auth.forgot}
                  </Link>
                </div>
              )}

              <Button fullWidth size="lg" loading={isLoading} type="submit">
                {isLogin ? t.auth.loginButton : t.auth.signupButton}
              </Button>
            </form>

            <p className="text-xs text-center text-gray-400 mt-6">
              {t.auth.agreeNote1}
              <Link href="/terms" className="text-caramel-500 hover:underline">{t.auth.terms}</Link>
              {t.auth.agreeNote2}
              <Link href="/privacy" className="text-caramel-500 hover:underline">{t.auth.privacy}</Link>
              {t.auth.agreeNote3}
            </p>
          </Card>
        </motion.div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <span className="font-semibold">{t.auth.canBackWithoutAccount}</span>
          <br />
          <Link href="/projects" className="text-caramel-500 hover:text-caramel-600 font-semibold">
            {t.common.viewProjects} →
          </Link>
        </p>
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
    <div
      className="min-h-screen flex items-center justify-center pt-20 pb-12 px-4"
      style={{ background: "linear-gradient(135deg, #FFFBF5 0%, #FFF5E6 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Card>
          <div className="text-center py-4">
            <div
              className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center text-white shadow-candy"
              style={{ background: "linear-gradient(135deg, #F2807B, #F5A34B)" }}
            >
              <MailCheck size={30} />
            </div>

            <h1 className="text-xl font-bold text-gray-800 mb-3">
              {t.auth.confirmTitle}
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              {t.auth.confirmBody}
            </p>

            <p className="inline-block px-4 py-2 rounded-xl bg-caramel-50 text-sm font-bold text-gray-700 break-all mb-6">
              {email}
            </p>

            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              {t.auth.confirmSpamNote}
            </p>

            <Button fullWidth size="lg" loading={isLoading} onClick={onResend}>
              {t.auth.confirmResend}
            </Button>

            <button
              onClick={onBack}
              className="mt-4 text-sm text-caramel-500 hover:text-caramel-600 font-semibold"
            >
              {t.auth.confirmBackToLogin}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
