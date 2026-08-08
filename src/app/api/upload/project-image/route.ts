import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { dbError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const BUCKET = "project-images";
const MAX_SIZE = 5 * 1024 * 1024;
const UPLOADS_PER_HOUR = 60;
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
  return createServiceClient(url, key, { auth: { persistSession: false } });
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

/** 掲載者以外に画像置き場として使われないようにする */
async function requireCreator(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return profile?.role === "creator" || profile?.role === "admin";
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  if (!(await requireCreator(user.id))) {
    return NextResponse.json(
      { error: "プロジェクトの掲載には運営の承認が必要です。" },
      { status: 403 }
    );
  }

  const limit = rateLimit(
    clientKey(req, `project-image:${user.id}`),
    UPLOADS_PER_HOUR,
    60 * 60 * 1000
  );
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const admin = getServiceClient();
  if (!admin) {
    return NextResponse.json(
      { error: "画像アップロードが設定されていません" },
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
      { error: "画像サイズは5MB以内にしてください" },
      { status: 400 }
    );
  }

  await ensureBucket(admin);

  // ギャラリーは一度に複数枚上がるので、時刻だけだと衝突する
  const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return dbError(uploadError, "画像のアップロードに失敗しました");
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl, path });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path : "";

  // 自分のフォルダ配下だけ。.. を挟んで他人の領域へ抜けられないようにする
  if (!path.startsWith(`${user.id}/`) || path.includes("..")) {
    return NextResponse.json(
      { error: "この画像は削除できません" },
      { status: 403 }
    );
  }

  const admin = getServiceClient();
  if (admin) {
    await admin.storage.from(BUCKET).remove([path]);
  }

  return NextResponse.json({ ok: true });
}
