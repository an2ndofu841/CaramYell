"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

export default function ResetPasswordClient() {
  const router = useRouter();
  const { user, loading, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 再設定リンクを踏んでいない（セッションがない）人はここに用がない
  useEffect(() => {
    if (!loading && !user) {
      toast.error("再設定リンクの有効期限が切れています。もう一度お試しください。");
      router.replace("/auth/forgot-password");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("パスワードは8文字以上にしてください");
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("パスワードを変更しました");
      router.push("/dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-candy-pink" />
      </div>
    );
  }

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
          <div className="py-2">
            <div
              className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center text-white shadow-candy"
              style={{ background: "linear-gradient(135deg, #F2807B, #F5A34B)" }}
            >
              <Lock size={28} />
            </div>

            <h1 className="text-xl font-bold text-gray-800 mb-2 text-center">
              新しいパスワード
            </h1>
            <p className="text-sm text-gray-500 mb-6 text-center">
              {user.email}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="新しいパスワード"
                type={showPassword ? "text" : "password"}
                placeholder="8文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              <Button fullWidth size="lg" loading={isSaving} type="submit">
                パスワードを変更する
              </Button>
            </form>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
