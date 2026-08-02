import { NextResponse } from "next/server";

/** RLS 違反の定型文はテーブル名が出るので、こちらは通さない */
const INTERNAL_DENIAL = /^(new row violates|permission denied|violates row-level)/i;

/**
 * DB のエラーをそのままクライアントへ返すと、テーブル名や制約名といった
 * 内部構造が漏れる。ただしガードトリガーが出す拒否理由（「掲載中の目標金額は
 * 変更できません」など）は掲載者に見せないと理由が分からないので、
 * insufficient_privilege(42501) で上げた自前のメッセージだけは通す。
 */
export function dbError(
  error: { message?: string; code?: string } | null,
  fallback = "処理に失敗しました。時間をおいて再度お試しください"
) {
  console.error("[db]", error);

  if (
    error?.code === "42501" &&
    error.message &&
    !INTERNAL_DENIAL.test(error.message)
  ) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ error: fallback }, { status: 500 });
}
