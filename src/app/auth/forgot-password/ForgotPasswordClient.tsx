"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, MailCheck } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
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
    <div
      className="min-h-screen flex items-center justify-center pt-20 pb-12 px-4"
      style={{ background: "linear-gradient(135deg, #FFFBF5 0%, #FFF5E6 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <div className="text-center py-2">
            <div
              className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center text-white shadow-candy"
              style={{ background: "linear-gradient(135deg, #F2807B, #F5A34B)" }}
            >
              {sent ? <MailCheck size={30} /> : <Mail size={30} />}
            </div>

            {sent ? (
              <>
                <h1 className="text-xl font-bold text-gray-800 mb-3">
                  再設定メールを送りました
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  メール内のリンクから新しいパスワードを設定してください。
                </p>
                <p className="inline-block px-4 py-2 rounded-xl bg-caramel-50 text-sm font-bold text-gray-700 break-all mb-6">
                  {email}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  数分待っても届かない場合は、迷惑メールフォルダもご確認ください。
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-gray-800 mb-2">
                  パスワードの再設定
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  登録したメールアドレスに、再設定用のリンクをお送りします。
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
              className="inline-block mt-6 text-sm text-caramel-500 hover:text-caramel-600 font-semibold"
            >
              ログイン画面に戻る
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
