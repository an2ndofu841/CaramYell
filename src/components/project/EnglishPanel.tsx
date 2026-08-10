"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, Languages } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_NOTE =
  "英語に切り替えて見ている人にはこちらが表示されます。空欄のままなら日本語がそのまま出ます。";

/**
 * 英語表示用の入力をまとめる開閉パネル。
 * すべて任意なので既定では閉じておき、すでに何か入っている場合だけ開く
 * （下書きを再開したときに、入れたはずの英語が隠れて見えないのを防ぐ）。
 */
export default function EnglishPanel({
  children,
  note = DEFAULT_NOTE,
  hasContent = false,
  className,
}: {
  children: ReactNode;
  note?: string;
  hasContent?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(hasContent);

  useEffect(() => {
    if (hasContent) setOpen(true);
  }, [hasContent]);

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-caramel-100 bg-caramel-50/40 overflow-hidden",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <Languages size={16} className="text-caramel-500 flex-shrink-0" />
        <span className="text-sm font-bold text-gray-700">英語表示（任意）</span>
        {hasContent && !open && (
          <span className="text-xs font-semibold text-caramel-500">入力済み</span>
        )}
        <ChevronDown
          size={16}
          className={cn(
            "ml-auto flex-shrink-0 text-gray-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">{note}</p>
          {children}
        </div>
      )}
    </div>
  );
}
