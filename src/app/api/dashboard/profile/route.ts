import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const TWITTER_RE = /^[A-Za-z0-9_]{1,15}$/;

const MAX_DISPLAY_NAME = 50;
const MAX_BIO = 300;

/** 空文字は「未設定」として NULL に寄せる */
function emptyToNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * 社内ネットワークや自ホストを指す宛先。アバターや外部リンクとして保存すると
 * 閲覧者のブラウザや将来のサーバー側取得がここへ向かうので弾く。
 */
const BLOCKED_HOST =
  /^(localhost|\[?::1\]?|0\.0\.0\.0|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;

/** スキームを省略して入力されがちなのでその場合は https を補う */
function normalizeUrl(raw: string): string | null {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    // http は混在コンテンツで画像が出ないうえ、経路上で差し替えられる
    if (url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    if (BLOCKED_HOST.test(url.hostname)) return null;
    if (url.username || url.password) return null;
    if (url.href.length > 500) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // 通常は auth トリガーが作るが、何らかの理由で無い場合はここで補う
  let profile = existing;
  if (!profile) {
    const { data: created, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        display_name: user.email?.split("@")[0] ?? "",
      })
      .select()
      .single();

    if (error) {
      return dbError(error);
    }
    profile = created;
  }

  return NextResponse.json({ profile, email: user.email });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "リクエストが不正です" }, { status: 400 });
  }

  const updateData: Record<string, string | null> = {};

  if (body.displayName !== undefined) {
    const displayName = emptyToNull(body.displayName);
    if (!displayName) {
      return NextResponse.json(
        { error: "表示名を入力してください" },
        { status: 400 }
      );
    }
    if (displayName.length > MAX_DISPLAY_NAME) {
      return NextResponse.json(
        { error: `表示名は${MAX_DISPLAY_NAME}文字以内で入力してください` },
        { status: 400 }
      );
    }
    updateData.display_name = displayName;
  }

  if (body.username !== undefined) {
    const username = emptyToNull(body.username)?.toLowerCase() ?? null;
    if (username && !USERNAME_RE.test(username)) {
      return NextResponse.json(
        {
          error:
            "ユーザーIDは半角英小文字・数字・アンダースコアの3〜20文字で入力してください",
        },
        { status: 400 }
      );
    }
    updateData.username = username;
  }

  if (body.bio !== undefined) {
    const bio = emptyToNull(body.bio);
    if (bio && bio.length > MAX_BIO) {
      return NextResponse.json(
        { error: `自己紹介は${MAX_BIO}文字以内で入力してください` },
        { status: 400 }
      );
    }
    updateData.bio = bio;
  }

  if (body.websiteUrl !== undefined) {
    const raw = emptyToNull(body.websiteUrl);
    if (raw) {
      const normalized = normalizeUrl(raw);
      if (!normalized) {
        return NextResponse.json(
          { error: "WebサイトのURLが正しくありません" },
          { status: 400 }
        );
      }
      updateData.website_url = normalized;
    } else {
      updateData.website_url = null;
    }
  }

  if (body.twitterHandle !== undefined) {
    const raw = emptyToNull(body.twitterHandle)?.replace(/^@/, "") ?? null;
    if (raw && !TWITTER_RE.test(raw)) {
      return NextResponse.json(
        { error: "Xのユーザー名は半角英数字・アンダースコアの15文字以内です" },
        { status: 400 }
      );
    }
    updateData.twitter_handle = raw;
  }

  // avatar_url は画像アップロードAPIで更新するが、外部URL指定も許可する
  if (body.avatarUrl !== undefined) {
    const raw = emptyToNull(body.avatarUrl);
    if (raw) {
      const normalized = normalizeUrl(raw);
      if (!normalized) {
        return NextResponse.json(
          { error: "アイコン画像のURLが正しくありません" },
          { status: 400 }
        );
      }
      updateData.avatar_url = normalized;
    } else {
      updateData.avatar_url = null;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "更新する項目がありません" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation（username の重複）
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "そのユーザーIDは既に使われています" },
        { status: 409 }
      );
    }
    return dbError(error);
  }

  return NextResponse.json({ profile: data });
}
