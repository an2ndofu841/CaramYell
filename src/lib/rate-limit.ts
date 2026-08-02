import type { NextRequest } from "next/server";

/**
 * 単純な固定ウィンドウのレート制限。
 *
 * 保存先はプロセス内のメモリなので、サーバーレスのインスタンスをまたぐと
 * カウントは共有されない。厳密な上限にはならないが、1か所からの連打で
 * OpenAI や Stripe の呼び出しを大量に発生させる、といった攻撃の
 * コストを上げるには十分。将来 Redis 等を入れるならここだけ差し替える。
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  // 毎回全走査すると重いので、間隔を空けて期限切れを掃除する
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** 次に試せるまでの秒数 */
  retryAfter: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/** レート制限のキーに使うクライアント識別子 */
export function clientKey(req: NextRequest, scope: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return `${scope}:${ip}`;
}

export function tooManyRequests(retryAfter: number) {
  return new Response(
    JSON.stringify({ error: "リクエストが多すぎます。少し時間をおいてください" }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfter),
      },
    }
  );
}
