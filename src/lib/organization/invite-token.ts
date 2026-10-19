import { createHash, randomBytes } from "crypto";

/**
 * 招待リンクのトークン。メールにはトークンそのものを載せ、
 * DB にはハッシュだけを残す（DB が漏れても招待リンクは作れない）。
 */
export function createInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashInviteToken(token) };
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** URL から来た値がトークンの形をしているか（base64url の32バイト） */
export const isInviteToken = (value: string) => /^[A-Za-z0-9_-]{43}$/.test(value);
