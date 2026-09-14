import { NextResponse } from "next/server";
import { tooManyRequests } from "@/lib/rate-limit";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

/** 成功レスポンスだけ短く CDN に載せる。支援額が数十秒遅れても差し支えない */
const CACHE_HIT = "public, s-maxage=30, stale-while-revalidate=60";

export function v1Options() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export function v1Json(
  data: unknown,
  init?: { status?: number; cache?: boolean }
) {
  const status = init?.status ?? 200;
  const headers = new Headers(CORS);
  headers.set(
    "Cache-Control",
    init?.cache && status === 200 ? CACHE_HIT : "no-store"
  );
  return NextResponse.json(data, { status, headers });
}

export function withV1Cors(response: Response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS)) {
    headers.set(key, value);
  }
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-store");
  }
  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
}

export function v1TooMany(retryAfter: number) {
  return withV1Cors(tooManyRequests(retryAfter));
}
