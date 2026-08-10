/**
 * 公開URL（/projects/〇〇）に使うスラッグ。
 *
 * これまではタイトルから自動生成していたが、日本語のタイトルは英数字が
 * 残らないため、ほとんどのプロジェクトが project-a1b2c3 のような URL に
 * なっていた。掲載者が自分で決められるようにする。
 */

export const SLUG_LIMITS = {
  min: 3,
  max: 60,
} as const;

/**
 * /projects/ の下にある実在のルート。ここと同じ名前を取られると
 * プロジェクトページが開けなくなる。
 */
const RESERVED = new Set(["create", "preview", "new", "edit"]);

const VALID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * 入力中の値をゆるく整える。末尾のハイフンは消さない
 * （消すと "my-" の続きが打てなくなる）。
 */
export function normalizeSlugInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-/, "")
    .slice(0, SLUG_LIMITS.max);
}

/** 保存前に確定させる。ここまで来たら末尾のハイフンも落とす */
export function normalizeSlug(value: unknown): string {
  if (typeof value !== "string") return "";
  return normalizeSlugInput(value).replace(/-+$/, "");
}

/** 使えない理由があれば日本語で返す。問題なければ null */
export function slugError(slug: string): string | null {
  if (slug.length < SLUG_LIMITS.min) {
    return `URLは${SLUG_LIMITS.min}文字以上で入力してください`;
  }
  if (slug.length > SLUG_LIMITS.max) {
    return `URLは${SLUG_LIMITS.max}文字以内で入力してください`;
  }
  if (!VALID.test(slug)) {
    return "URLは半角英数字とハイフンのみ使えます";
  }
  if (RESERVED.has(slug)) {
    return "このURLは予約されているため使えません";
  }
  return null;
}

/**
 * 掲載者が決めなかった場合の自動生成。
 * 日本語だけのタイトルは英数字が残らないので project- で始まる。
 */
export function autoSlug(title: unknown): string {
  const base = normalizeSlug(title) || "project";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base.slice(0, SLUG_LIMITS.max - 7)}-${suffix}`;
}
