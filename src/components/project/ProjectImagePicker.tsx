"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

const MAX_SIZE = 5 * 1024 * 1024;
const MAX_GALLERY = 8;
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

export interface ProjectImages {
  mainImageUrl: string | null;
  images: string[];
}

interface Props extends ProjectImages {
  onChange: (next: ProjectImages) => void;
}

/** 公開URLから storage 上のパスを取り出す。取れなければ null */
function pathFromUrl(url: string): string | null {
  const marker = "/object/public/project-images/";
  const at = url.indexOf(marker);
  return at === -1 ? null : decodeURIComponent(url.slice(at + marker.length));
}

async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/upload/project-image", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "アップロードに失敗しました");
  return data.url as string;
}

export default function ProjectImagePicker({
  mainImageUrl,
  images,
  onChange,
}: Props) {
  const [busy, setBusy] = useState<"main" | "gallery" | null>(null);
  const mainInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  // この画面で上げた分だけは、取り消したときに実体も消す。
  // 保存済みの画像まで消すと、保存前に離脱されたとき表示が壊れる。
  const uploadedHere = useRef<Set<string>>(new Set());

  const discard = (url: string) => {
    if (!uploadedHere.current.has(url)) return;
    uploadedHere.current.delete(url);
    const path = pathFromUrl(url);
    if (!path) return;
    void fetch("/api/upload/project-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
  };

  const validate = (file: File) => {
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("PNG / JPEG / WebP / GIF の画像を選んでください");
      return false;
    }
    if (file.size > MAX_SIZE) {
      toast.error("画像は5MBまでです");
      return false;
    }
    return true;
  };

  const handleMain = async (file: File | undefined) => {
    if (!file || !validate(file)) return;
    setBusy("main");
    try {
      const url = await uploadImage(file);
      uploadedHere.current.add(url);
      if (mainImageUrl) discard(mainImageUrl);
      onChange({ mainImageUrl: url, images });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setBusy(null);
      if (mainInput.current) mainInput.current.value = "";
    }
  };

  const handleGallery = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_GALLERY - images.length;
    if (room <= 0) {
      toast.error(`ギャラリーは${MAX_GALLERY}枚までです`);
      return;
    }
    const picked = Array.from(files).slice(0, room).filter(validate);
    if (!picked.length) return;

    setBusy("gallery");
    try {
      const urls = await Promise.all(picked.map(uploadImage));
      urls.forEach((u) => uploadedHere.current.add(u));
      onChange({ mainImageUrl, images: [...images, ...urls] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setBusy(null);
      if (galleryInput.current) galleryInput.current.value = "";
    }
  };

  const removeMain = () => {
    if (mainImageUrl) discard(mainImageUrl);
    onChange({ mainImageUrl: null, images });
  };

  const removeGallery = (url: string) => {
    discard(url);
    onChange({ mainImageUrl, images: images.filter((u) => u !== url) });
  };

  const promote = (url: string) => {
    // 入れ替えるだけなので、どちらの実体も消さない
    const rest = images.filter((u) => u !== url);
    onChange({
      mainImageUrl: url,
      images: mainImageUrl ? [...rest, mainImageUrl] : rest,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          メイン画像
          <span className="text-xs text-gray-400 font-normal ml-1">
            （一覧やSNSでいちばん目に入る1枚）
          </span>
        </p>

        <input
          ref={mainInput}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleMain(e.target.files?.[0])}
        />

        {mainImageUrl ? (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border-2 border-caramel-100 group">
            <Image
              src={mainImageUrl}
              alt="メイン画像"
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => mainInput.current?.click()}
                className="px-3 py-2 rounded-xl bg-white/95 text-xs font-bold text-gray-700"
              >
                差し替える
              </button>
              <button
                type="button"
                onClick={removeMain}
                className="px-3 py-2 rounded-xl bg-white/95 text-xs font-bold text-red-500"
              >
                削除
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => mainInput.current?.click()}
            disabled={busy === "main"}
            className="w-full aspect-[16/9] rounded-2xl border-2 border-dashed border-caramel-200 hover:border-candy-pink hover:bg-caramel-50/50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 disabled:opacity-60"
          >
            {busy === "main" ? (
              <Loader2 size={28} className="animate-spin" />
            ) : (
              <ImagePlus size={28} />
            )}
            <span className="text-sm font-semibold">
              {busy === "main" ? "アップロード中..." : "画像を選ぶ"}
            </span>
            <span className="text-xs">PNG / JPEG / WebP / GIF・5MBまで</span>
          </button>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">
            ギャラリー
            <span className="text-xs text-gray-400 font-normal ml-1">（任意）</span>
          </p>
          <span className="text-xs text-gray-400">
            {images.length} / {MAX_GALLERY}
          </span>
        </div>

        <input
          ref={galleryInput}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => handleGallery(e.target.files)}
        />

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url) => (
            <div
              key={url}
              className="relative aspect-square rounded-xl overflow-hidden border-2 border-caramel-100 group"
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => promote(url)}
                  title="メイン画像にする"
                  className="p-1.5 rounded-lg bg-white/95 text-caramel-600"
                >
                  <Star size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeGallery(url)}
                  title="削除"
                  className="p-1.5 rounded-lg bg-white/95 text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {images.length < MAX_GALLERY && (
            <button
              type="button"
              onClick={() => galleryInput.current?.click()}
              disabled={busy === "gallery"}
              className="aspect-square rounded-xl border-2 border-dashed border-caramel-200 hover:border-candy-pink hover:bg-caramel-50/50 transition-colors flex flex-col items-center justify-center gap-1 text-gray-400 disabled:opacity-60"
            >
              {busy === "gallery" ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ImagePlus size={20} />
              )}
              <span className="text-[11px] font-semibold">追加</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
