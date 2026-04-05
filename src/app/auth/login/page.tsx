"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Github } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const { signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signInWithEmail(form.email, form.password);
        if (error) {
          toast.error(
            error.message === "Invalid login credentials"
              ? "メールアドレスまたはパスワードが正しくありません"
              : error.message
          );
          return;
        }
        toast.success("ログインしました！");
        router.push(redirectTo);
      } else {
        if (form.password.length < 8) {
          toast.error("パスワードは8文字以上にしてください");
          return;
        }
        const { error } = await signUpWithEmail(form.email, form.password);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("確認メールを送信しました。メールを確認してください。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    const { error } = await signInWithOAuth(provider);
    if (error) toast.error(error.message);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center pt-20 pb-12 px-4"
      style={{ background: "linear-gradient(135deg, #FFFBF5 0%, #FFF5E6 100%)" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-20"
          style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-48 h-48 rounded-full opacity-15"
          style={{ background: "linear-gradient(135deg, #4ECDC4, #74C0FC)" }}
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
            style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)", fontFamily: "Fredoka One, sans-serif" }}
          >
            C
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isLogin ? "おかえりなさい！" : "はじめまして！"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isLogin ? "CaramYellにログインする" : "CaramYellに登録する（無料）"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <div className="flex p-1 bg-caramel-50 rounded-2xl mb-6">
              {["ログイン", "新規登録"].map((tab, i) => (
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
                      ? { background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }
                      : {}
                  }
                >
                  {tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="メールアドレス"
                type="email"
                placeholder="caramel@example.com"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                icon={<Mail size={16} />}
                fullWidth
                required
              />

              <Input
                label="パスワード"
                type={showPassword ? "text" : "password"}
                placeholder="8文字以上"
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
                    パスワードを忘れた方
                  </Link>
                </div>
              )}

              <Button fullWidth size="lg" loading={isLoading} type="submit">
                {isLogin ? "ログインする" : "アカウントを作成する"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-caramel-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400 font-medium">または</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleOAuth("google")}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border-2 border-caramel-100 hover:bg-caramel-50 transition-colors font-semibold text-sm text-gray-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Googleで続ける
              </button>

              <button
                onClick={() => handleOAuth("github")}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border-2 border-caramel-100 hover:bg-caramel-50 transition-colors font-semibold text-sm text-gray-600"
              >
                <Github size={18} />
                GitHubで続ける
              </button>
            </div>

            <p className="text-xs text-center text-gray-400 mt-6">
              続けることで、
              <Link href="/terms" className="text-caramel-500 hover:underline">利用規約</Link>
              と
              <Link href="/privacy" className="text-caramel-500 hover:underline">プライバシーポリシー</Link>
              に同意したことになります
            </p>
          </Card>
        </motion.div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <span className="font-semibold">アカウント登録なしでも応援できます！</span>
          <br />
          <Link href="/projects" className="text-caramel-500 hover:text-caramel-600 font-semibold">
            プロジェクトを見る →
          </Link>
        </p>
      </div>
    </div>
  );
}
