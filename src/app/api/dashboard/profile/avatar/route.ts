import { NextRequest, NextResponse } from "next/server";
import { dbError } from "@/lib/api/errors";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const BUCKET = "avatars";
const MAX_SIZE = 2 * 1024 * 1024;
/** service_role で保存する経路なので、連打でストレージを埋められないようにする */
const UPLOADS_PER_HOUR = 30;
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false },
  });
}

type ServiceClient = NonNullable<ReturnType<typeof getServiceClient>>;

/** マイグレーション未適用でも動くように、無ければその場で作る */
async function ensureBucket(admin: ServiceClient) {
  const { data } = await admin.storage.getBucket(BUCKET);
  if (data) return;
  await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_SIZE,
    allowedMimeTypes: Object.keys(ALLOWED_TYPES),
  });
}

/** 同じユーザーの古い画像を残さない（指定ファイルは除く） */
async function removeUserFiles(
  admin: ServiceClient,
  userId: string,
  keepPath?: string
) {
  const { data: files } = await admin.storage.from(BUCKET).list(userId);
  const targets = (files || [])
    .map((f) => `${userId}/${f.name}`)
    .filter((path) => path !== keepPath);
  if (targets.length > 0) {
    await admin.storage.from(BUCKET).remove(targets);
  }
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(
    clientKey(req, "avatar-upload"),
    UPLOADS_PER_HOUR,
    60 * 60 * 1000
  );
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const admin = getServiceClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "画像アップロードが設定されていません。画像URLを直接指定してください。",
      },
      { status: 503 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "画像ファイルを選択してください" },
      { status: 400 }
    );
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "PNG / JPEG / WebP / GIF の画像を選択してください" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "画像サイズは2MB以内にしてください" },
      { status: 400 }
    );
  }

  await ensureBucket(admin);

  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    return dbError(uploadError);
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path);

  const { data: profile, error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id)
    .select()
    .single();

  if (updateError) {
    await admin.storage.from(BUCKET).remove([path]);
    return dbError(updateError);
  }

  await removeUserFiles(admin, user.id, path);

  return NextResponse.json({ profile, avatarUrl: publicUrl });
}

export async function DELETE() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return dbError(error);
  }

  const admin = getServiceClient();
  if (admin) {
    await removeUserFiles(admin, user.id);
  }

  return NextResponse.json({ profile });
}
