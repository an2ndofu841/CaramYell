/**
 * 本文中のリンク・画像URLの受け入れ判定。
 *   npx tsx scripts/check-markdown-url.ts
 *
 * Markdown.tsx の safeUrl と同じ実装をここに写している（コンポーネントは
 * JSX を含むため直接読み込むと重い）。挙動を変えたら両方直す。
 */

import { defaultUrlTransform } from "react-markdown";

function safeUrl(url: string): string {
  const cleaned = defaultUrlTransform(url);
  if (!cleaned) return "";
  if (/^\/[/\\]/.test(cleaned)) return "";
  if (/^https?:(?!\/\/)/i.test(cleaned)) return "";
  if (/^(https?:\/\/|mailto:|#|\/)/i.test(cleaned)) return cleaned;
  return "";
}

let failed = 0;

function blocked(label: string, url: string) {
  const out = safeUrl(url);
  const ok = out === "";
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} 遮断: ${label} (${url})`);
  if (!ok) console.log(`       通ってしまった: ${out}`);
}

function allowed(label: string, url: string) {
  const out = safeUrl(url);
  const ok = out !== "";
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} 許可: ${label} (${url})`);
}

blocked("javascript スキーム", "javascript:alert(1)");
blocked("大文字混じりの javascript", "JaVaScRiPt:alert(1)");
blocked("data URL の HTML", "data:text/html,<script>alert(1)</script>");
blocked("vbscript スキーム", "vbscript:msgbox(1)");
blocked("プロトコル相対", "//evil.example/login");
blocked("バックスラッシュ版", "/\\evil.example/login");
blocked("スラッシュ不足の https", "https:/evil.example");
blocked("スキームだけの https", "https:evil.example");

allowed("通常の外部リンク", "https://example.com/page");
allowed("http", "http://example.com");
allowed("メール", "mailto:hello@example.com");
allowed("ページ内アンカー", "#section");
allowed("サイト内の相対リンク", "/projects/scent-music-album");
allowed("画像URL", "https://example.com/a.png");

console.log(failed === 0 ? "\nすべて通りました" : `\n${failed} 件失敗`);
process.exit(failed === 0 ? 0 : 1);
