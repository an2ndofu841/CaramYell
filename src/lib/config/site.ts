export const SITE_NAME = "CaramYell";

/** 本番の公開ドメイン */
export const SITE_DOMAIN = "caramyell.com";

const PRODUCTION_URL = `https://${SITE_DOMAIN}`;

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, "");

/**
 * サイトの公開URL。
 * - 本番は常に本番ドメイン（Vercelの環境変数にローカルURLが残っていても影響を受けない）
 * - ローカル開発では NEXT_PUBLIC_APP_URL（既定 http://localhost:3000）
 * - NEXT_PUBLIC_SITE_URL を設定すると全環境で上書きできる（独自プレビュー用）
 */
function resolveSiteUrl(): string {
  const override = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (override) return stripTrailingSlash(override);

  if (process.env.NODE_ENV === "development") {
    const local = process.env.NEXT_PUBLIC_APP_URL?.trim();
    return stripTrailingSlash(local || "http://localhost:3000");
  }

  return PRODUCTION_URL;
}

export const SITE_URL = resolveSiteUrl();

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
