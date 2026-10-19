"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
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
        <Loader2 size={32} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-white p-6 sm:p-8">
        <h1
          className="text-xl font-bold text-ink mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          新しいパスワード
        </h1>
        <p className="text-sm text-ink-muted mb-6 break-all">{user.email}</p>

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
                className="text-ink-muted hover:text-ink"
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
    </div>
  );
}
