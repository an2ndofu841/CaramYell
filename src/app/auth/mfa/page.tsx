"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/safe-redirect";

type Stage =
  | { name: "loading" }
  | { name: "enroll"; factorId: string; qr: string; secret: string }
  | { name: "verify"; factorId: string }
  | { name: "active"; factorId: string }
  | { name: "unavailable"; message: string };

export default function MfaPage() {
  return (
    <Suspense fallback={null}>
      <Mfa />
    </Suspense>
  );
}

function Mfa() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirectPath(searchParams.get("next"), "/dashboard");

  const [supabase] = useState(() => createClient());
  const [stage, setStage] = useState<Stage>({ name: "loading" });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(`/auth/mfa?next=${next}`)}`
      );
      return;
    }

    const { data: factors, error: listError } =
      await supabase.auth.mfa.listFactors();
    if (listError) {
      setStage({ name: "unavailable", message: listError.message });
      return;
    }

    const verified = factors.totp.find((f) => f.status === "verified");
    if (verified) {
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setStage(
        aal?.currentLevel === "aal2"
          ? { name: "active", factorId: verified.id }
          : { name: "verify", factorId: verified.id }
      );
      return;
    }

    // 登録途中で離脱した分が残っていると、同じ名前で登録し直せない
    for (const stale of factors.all.filter((f) => f.status !== "verified")) {
      await supabase.auth.mfa.unenroll({ factorId: stale.id });
    }

    const { data: enrolled, error: enrollError } =
      await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "認証アプリ",
      });
    if (enrollError || !enrolled) {
      setStage({
        name: "unavailable",
        message: enrollError?.message ?? "二段階認証を開始できませんでした",
      });
      return;
    }

    setStage({
      name: "enroll",
      factorId: enrolled.id,
      qr: enrolled.totp.qr_code,
      secret: enrolled.totp.secret,
    });
  }, [supabase, router, next]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitCode = async (factorId: string) => {
    if (code.length !== 6) {
      toast.error("6桁の数字を入力してください");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      if (error) {
        toast.error(
          error.message.includes("Invalid")
            ? "コードが違います。アプリの表示を確認してもう一度お試しください。"
            : error.message
        );
        setCode("");
        return;
      }
      toast.success("二段階認証を確認しました");
      router.replace(next);
    } finally {
      setBusy(false);
    }
  };

  const disable = async (factorId: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("二段階認証を解除しました");
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center pt-20 pb-12 px-4"
      style={{ background: "linear-gradient(135deg, #FFFBF5 0%, #FFF5E6 100%)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white shadow-candy"
            style={{ background: "linear-gradient(135deg, #F2807B, #F5A34B)" }}
          >
            <ShieldCheck size={30} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">二段階認証</h1>
        </div>

        <Card>
          {stage.name === "loading" && (
            <div className="py-10 flex justify-center">
              <Loader2 size={28} className="animate-spin text-candy-pink" />
            </div>
          )}

          {stage.name === "unavailable" && (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-600 leading-relaxed">
                二段階認証を利用できませんでした。
              </p>
              <p className="text-xs text-gray-400 mt-2 break-all">
                {stage.message}
              </p>
            </div>
          )}

          {stage.name === "enroll" && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                認証アプリ（Google Authenticator や 1Password など）でこの
                QRコードを読み取り、表示された6桁の数字を入力してください。
              </p>
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-2xl border-2 border-caramel-100">
                  <Image
                    src={stage.qr}
                    alt="二段階認証のQRコード"
                    width={180}
                    height={180}
                    unoptimized
                  />
                </div>
              </div>
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer font-semibold">
                  QRコードを読み取れない場合
                </summary>
                <p className="mt-2 break-all font-mono bg-caramel-50 rounded-xl p-3">
                  {stage.secret}
                </p>
              </details>
              <CodeField value={code} onChange={setCode} />
              <Button
                fullWidth
                size="lg"
                loading={busy}
                onClick={() => submitCode(stage.factorId)}
              >
                有効にする
              </Button>
            </div>
          )}

          {stage.name === "verify" && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                認証アプリに表示されている6桁の数字を入力してください。
              </p>
              <CodeField value={code} onChange={setCode} />
              <Button
                fullWidth
                size="lg"
                loading={busy}
                onClick={() => submitCode(stage.factorId)}
              >
                確認する
              </Button>
            </div>
          )}

          {stage.name === "active" && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                このアカウントでは二段階認証が有効です。
              </p>
              <Button fullWidth size="lg" onClick={() => router.replace(next)}>
                戻る
              </Button>
              <Button
                fullWidth
                variant="ghost"
                loading={busy}
                onClick={() => disable(stage.factorId)}
              >
                二段階認証を解除する
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function CodeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Input
      label="確認コード"
      inputMode="numeric"
      autoComplete="one-time-code"
      placeholder="000000"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      icon={<KeyRound size={16} />}
      fullWidth
      autoFocus
    />
  );
}
