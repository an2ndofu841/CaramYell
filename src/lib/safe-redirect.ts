/**
 * クエリで渡された遷移先を、自サイト内の相対パスに限定する。
 *
 * `${origin}${next}` のように連結して使うため、"//evil.example" や
 * "@evil.example"（origin と繋がると userinfo と解釈される）をそのまま
 * 通すと外部サイトへ飛ばせてしまう。ログイン直後の遷移先なので、
 * フィッシングの踏み台にされないよう素直な相対パスだけを許可する。
 */
export function safeRedirectPath(
  raw: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (typeof raw !== "string") return fallback;

  const path = raw.trim();
  if (!path.startsWith("/")) return fallback;
  // "//host" と "/\host" はプロトコル相対 URL として扱われる
  if (path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(path)) return fallback;

  return path;
}
