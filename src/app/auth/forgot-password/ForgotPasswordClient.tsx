"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MailCheck } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

export default function ForgotPasswordClient() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const { error } = await sendPasswordReset(email);
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-white p-6 sm:p-8">
        {sent ? (
          <>
            <MailCheck size={24} className="text-ink-muted mb-4" />
            <h1
              className="text-xl font-bold text-ink mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              再設定メールを送りました
            </h1>
            <p className="text-sm text-ink-soft leading-relaxed mb-4">
              メール内のリンクから新しいパスワードを設定してください。
            </p>
            <p className="px-4 py-3 rounded-lg bg-cream-100 text-sm font-bold text-ink break-all mb-4">
              {email}
            </p>
            <p className="text-xs text-ink-muted leading-relaxed">
              数分待っても届かない場合は、迷惑メールフォルダもご確認ください。
            </p>
          </>
        ) : (
          <>
            <h1
              className="text-xl font-bold text-ink mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              パスワードの再設定
            </h1>
            <p className="text-sm text-ink-soft leading-relaxed mb-6">
              登録したメールアドレスに、再設定用のリンクをお送りします。
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="メールアドレス"
                type="email"
                placeholder="caramel@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={16} />}
                fullWidth
                required
              />
              <Button fullWidth size="lg" loading={isLoading} type="submit">
                再設定メールを送る
              </Button>
            </form>
          </>
        )}

        <Link
          href="/auth/login"
          className="inline-block mt-6 text-sm text-ink-soft hover:text-ink font-semibold"
        >
          ログイン画面に戻る
        </Link>
      </div>
    </div>
  );
}
