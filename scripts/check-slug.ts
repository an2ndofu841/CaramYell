/**
 * 公開URL（スラッグ）の正規化と判定の確認。
 *   npx tsx scripts/check-slug.ts
 */

import {
  autoSlug,
  canEditSlug,
  normalizeSlug,
  normalizeSlugInput,
  slugError,
} from "../src/lib/project/slug";

let failed = 0;

function eq(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) console.log(`       expected ${expected}, got ${actual}`);
}

// 入力中はうしろのハイフンを残す（続きが打てなくなるため）
eq("入力中: 末尾ハイフンは残す", normalizeSlugInput("my-"), "my-");
eq("入力中: 大文字は小文字に", normalizeSlugInput("MyProject"), "myproject");
eq("入力中: 空白はハイフンに", normalizeSlugInput("my project"), "my-project");
eq("入力中: 連続ハイフンは1つに", normalizeSlugInput("a---b"), "a-b");
eq("入力中: 先頭ハイフンは落とす", normalizeSlugInput("-abc"), "abc");
eq("入力中: 記号はハイフンに", normalizeSlugInput("a_b!c"), "a-b-c");

// 確定時は末尾も落とす
eq("確定: 末尾ハイフンを落とす", normalizeSlug("my-"), "my");
eq("確定: 日本語だけなら空", normalizeSlug("生誕ライブ"), "");
eq("確定: 文字列以外は空", normalizeSlug(null), "");

// 判定
eq("判定: 正しい値は通る", slugError("scent-music-album"), null);
eq(
  "判定: 短すぎる",
  slugError("ab"),
  "URLは3文字以上で入力してください"
);
eq(
  "判定: 予約語は弾く",
  slugError("create"),
  "このURLは予約されているため使えません"
);
eq(
  "判定: 末尾ハイフンは弾く",
  slugError("abc-"),
  "URLは半角英数字とハイフンのみ使えます"
);

// 自動生成
const auto = autoSlug("Scent Music Album");
eq("自動: タイトルから作る", auto.startsWith("scent-music-album-"), true);
eq("自動: 日本語のみは project-", autoSlug("生誕ライブ").startsWith("project-"), true);
eq("自動: 生成物は有効", slugError(auto), null);
eq("自動: 60文字を超えない", autoSlug("a".repeat(120)).length <= 60, true);

// 変更できるのは外にリンクが出ていない間だけ
eq("編集可否: 下書き", canEditSlug("draft"), true);
eq("編集可否: 審査中", canEditSlug("reviewing"), true);
eq("編集可否: キャンセル", canEditSlug("cancelled"), true);
eq("編集可否: 公開中は不可", canEditSlug("active"), false);
eq("編集可否: 達成後は不可", canEditSlug("funded"), false);
eq("編集可否: 終了後は不可", canEditSlug("completed"), false);
eq("編集可否: 未設定は不可", canEditSlug(null), false);

console.log(failed === 0 ? "\nすべて通りました" : `\n${failed} 件失敗`);
process.exit(failed === 0 ? 0 : 1);
