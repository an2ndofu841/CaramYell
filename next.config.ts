import type { NextConfig } from "next";

// Content-Security-Policy。
// Next.js のインラインスクリプトに nonce を配っていないため script-src は
// まだ緩いが、クリックジャッキング・フォームの外部送信・<base> の差し替え
// といった、テーマや文言を細工されたときに効いてくる経路は塞いでおく。
// 開発サーバーは HMR の WebSocket があるため適用しない。
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // アイコンは掲載者が任意の URL を指定できる
  "img-src 'self' data: blob: https:",
  // ブラウザから直接叩く外部 API はここに書かないと本番だけ黙って失敗する。
  // zipcloud は住所欄の郵便番号検索。
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://zipcloud.ibsnet.co.jp",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Content-Security-Policy", value: csp }]
    : []),
];

// 最適化を通る画像はサーバー上の libvips がデコードするため、許可ホストは
// 自分たちのストレージだけに絞る。*.supabase.co のままだと、掲載者が
// main_image_url に自分で用意した Supabase プロジェクトの URL を入れて、
// 細工画像をこちらのデコーダに食わせられる。
const supabaseImageHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      ...(supabaseImageHost
        ? [{ protocol: "https" as const, hostname: supabaseImageHost }]
        : []),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // OAuth ログイン時に引き継がれるアイコン
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
