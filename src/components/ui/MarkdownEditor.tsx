"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Markdown from "@/components/ui/Markdown";
import {
  insertImage,
  insertLink,
  togglePrefix,
  wrapSelection,
  type TextSelection,
} from "@/lib/markdown/edit";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  labelExtra?: React.ReactNode;
  placeholder?: string;
  hint?: string;
  rows?: number;
  /** 本文に画像を差し込めるようにする。掲載者向けの画面でのみ true にする */
  allowImages?: boolean;
}

/**
 * 見出しや箇条書きを付けられる本文エディタ。
 *
 * 記法は Markdown だが、掲載者が記法を覚えなくていいようにツールバーから
 * 挿入できるようにしてある。保存されるのはあくまで素のテキストなので、
 * 既存のプレーンな本文もそのまま扱える。
 */
export default function MarkdownEditor({
  value,
  onChange,
  label,
  labelExtra,
  placeholder,
  hint,
  rows = 10,
  allowImages = false,
}: Props) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  /** 変換をかけて、カーソルを編集箇所に残したまま親へ返す */
  const apply = (transform: (sel: TextSelection) => TextSelection) => {
    const el = textarea.current;
    if (!el) return;
    const next = transform({
      value,
      start: el.selectionStart,
      end: el.selectionEnd,
    });
    onChange(next.value);
    requestAnimationFrame(() => {
      const node = textarea.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(next.start, next.end);
    });
  };

  const uploadAndInsert = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("PNG / JPEG / WebP / GIF の画像を選んでください");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("画像は5MBまでです");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload/project-image", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "アップロードに失敗しました");

      apply((sel) => insertImage(sel, data.url as string));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const toolbarButton =
    "p-2 rounded-lg text-gray-500 hover:text-caramel-600 hover:bg-caramel-50 transition-colors disabled:opacity-40";

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {(label || labelExtra) && (
        <div className="flex items-center justify-between">
          {label && (
            <p className="text-sm font-semibold text-gray-700">{label}</p>
          )}
          {labelExtra}
        </div>
      )}

      <div className="rounded-2xl border-2 border-caramel-100 bg-white overflow-hidden focus-within:border-candy-pink transition-colors">
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-caramel-100 flex-wrap">
          <button
            type="button"
            onClick={() => apply((sel) => togglePrefix(sel, "## "))}
            className={toolbarButton}
            title="見出し"
            aria-label="見出し"
          >
            <Heading2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => apply((sel) => togglePrefix(sel, "### "))}
            className={toolbarButton}
            title="小見出し"
            aria-label="小見出し"
          >
            <Heading3 size={16} />
          </button>
          <button
            type="button"
            onClick={() => apply((sel) => wrapSelection(sel, "**", "太字"))}
            className={toolbarButton}
            title="太字"
            aria-label="太字"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => apply((sel) => togglePrefix(sel, "- "))}
            className={toolbarButton}
            title="箇条書き"
            aria-label="箇条書き"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => apply((sel) => togglePrefix(sel, "1. "))}
            className={toolbarButton}
            title="番号付きリスト"
            aria-label="番号付きリスト"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onClick={() => apply((sel) => togglePrefix(sel, "> "))}
            className={toolbarButton}
            title="引用"
            aria-label="引用"
          >
            <Quote size={16} />
          </button>
          <button
            type="button"
            onClick={() => apply(insertLink)}
            className={toolbarButton}
            title="リンク"
            aria-label="リンク"
          >
            <Link2 size={16} />
          </button>
          {allowImages && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className={toolbarButton}
              title="画像を挿入"
              aria-label="画像を挿入"
            >
              {uploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ImagePlus size={16} />
              )}
            </button>
          )}

          <div className="ml-auto flex items-center gap-1">
            {(["write", "preview"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-colors",
                  tab === id
                    ? "bg-caramel-100 text-caramel-700"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {id === "write" ? "書く" : "プレビュー"}
              </button>
            ))}
          </div>
        </div>

        {tab === "write" ? (
          <textarea
            ref={textarea}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className="w-full py-3 px-4 text-gray-800 placeholder:text-gray-400 outline-none resize-y bg-transparent"
          />
        ) : (
          <div className="py-3 px-4 min-h-[8rem]">
            {value.trim() ? (
              <Markdown>{value}</Markdown>
            ) : (
              <p className="text-sm text-gray-400">
                まだ何も書かれていません
              </p>
            )}
          </div>
        )}
      </div>

      {allowImages && (
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => uploadAndInsert(e.target.files?.[0])}
        />
      )}

      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
