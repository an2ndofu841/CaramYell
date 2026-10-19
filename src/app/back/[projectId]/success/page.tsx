import Link from "next/link";
import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";
import {
  getStripeClient,
  recordBackingFromSession,
} from "@/lib/stripe/record-backing";

export const metadata: Metadata = {
  title: "応援ありがとうございます",
};

export const dynamic = "force-dynamic";

async function getSession(sessionId?: string) {
  if (!sessionId || !process.env.STRIPE_SECRET_KEY) return null;
  try {
    return await getStripeClient().checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }
}

export default async function BackingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { projectId } = await params;
  const { session_id } = await searchParams;
  const session = await getSession(session_id);

  // webhook が届かない環境（ローカル開発など）や配信失敗に備えて、
  // 戻ってきた時点でも支援を確定させる。二重登録は UNIQUE 制約で防いでいる。
  if (session) {
    const result = await recordBackingFromSession(session);
    if (result.status === "error") {
      console.error("Failed to record backing on success page:", result.message);
    }
  }

  const paid = session?.payment_status === "paid";
  const total = session?.amount_total ?? null;
  const email = session?.customer_details?.email || session?.customer_email;

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center pt-24 pb-16 px-4">
      <div className="max-w-md w-full text-center rounded-xl border border-line bg-white px-6 py-10 sm:px-10">
        <CircleCheck
          size={32}
          strokeWidth={1.75}
          className="mx-auto mb-4 text-emerald-700"
        />
        <h1
          className="text-2xl font-bold text-ink mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          応援ありがとうございます
        </h1>

        {paid ? (
          <>
            <p className="text-ink-soft leading-relaxed mb-2">
              決済が完了しました。
              {total != null && (
                <>
                  <br />
                  お支払い金額：
                  <span className="font-bold text-ink tabular-nums">
                    ¥{total.toLocaleString()}
                  </span>
                </>
              )}
            </p>
            {email && (
              <p className="text-sm text-ink-muted mb-8">
                確認メールを <strong className="text-ink">{email}</strong> にお送りします。
              </p>
            )}
          </>
        ) : (
          <p className="text-ink-soft leading-relaxed mb-8">
            お支払い手続きを受け付けました。反映まで少しお時間がかかる場合があります。
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-ink text-white text-sm font-bold hover:bg-ink-soft transition-colors"
          >
            プロジェクトに戻る
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-line-strong bg-white text-sm font-bold text-ink hover:bg-cream-100 transition-colors"
          >
            他のプロジェクトを見る
          </Link>
        </div>
      </div>
    </div>
  );
}
