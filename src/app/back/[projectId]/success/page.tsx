import Link from "next/link";
import Stripe from "stripe";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "応援ありがとうございます",
};

async function getSession(sessionId?: string) {
  if (!sessionId || !process.env.STRIPE_SECRET_KEY) return null;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
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

  const paid = session?.payment_status === "paid";
  const total = session?.amount_total ?? null;
  const email = session?.customer_details?.email || session?.customer_email;

  return (
    <div
      className="min-h-screen flex items-center justify-center pt-20 pb-16 px-4"
      style={{ background: "linear-gradient(135deg, #FFFBF5 0%, #FFF5E6 100%)" }}
    >
      <div className="max-w-md w-full text-center">
        <div className="text-7xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          応援ありがとうございます！
        </h1>

        {paid ? (
          <>
            <p className="text-gray-500 leading-relaxed mb-2">
              決済が完了しました。
              {total != null && (
                <>
                  <br />
                  お支払い金額：
                  <span className="font-bold text-caramel-600">
                    ¥{total.toLocaleString()}
                  </span>
                </>
              )}
            </p>
            {email && (
              <p className="text-sm text-gray-400 mb-8">
                確認メールを <strong>{email}</strong> にお送りします。
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-500 leading-relaxed mb-8">
            お支払い手続きを受け付けました。反映まで少しお時間がかかる場合があります。
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/projects/${projectId}`}
            className="px-8 py-3 rounded-full text-white font-bold btn-pop"
            style={{
              background: "linear-gradient(135deg, #F2807B, #F5A34B)",
              boxShadow: "0 4px 20px rgba(242, 128, 123, 0.4)",
            }}
          >
            プロジェクトに戻る
          </Link>
          <Link
            href="/projects"
            className="px-8 py-3 rounded-full font-bold text-gray-500 border-2 border-caramel-100 hover:bg-caramel-50 transition-colors"
          >
            他のプロジェクトを見る
          </Link>
        </div>
      </div>
    </div>
  );
}
