"use client";

import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "./LocaleProvider";

/**
 * 日本語 / English の切り替えボタン。
 * compact はスマホのヘッダー用で、地球アイコンを省いて幅を詰める。
 */
export default function LocaleSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 p-0.5 rounded-full border-2 border-caramel-100 bg-white",
        className
      )}
      role="group"
      aria-label="言語 / Language"
    >
      {!compact && (
        <Globe size={13} className="text-gray-400 ml-1.5 flex-shrink-0" />
      )}
      {(["ja", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "rounded-full text-xs font-bold transition-colors",
            compact ? "px-2 py-1.5" : "px-2 py-1",
            locale === l
              ? "text-white"
              : "text-gray-500 hover:text-caramel-600"
          )}
          style={
            locale === l
              ? { background: "linear-gradient(135deg, #F2807B, #F5A34B)" }
              : {}
          }
        >
          {l === "ja" ? "日本語" : "EN"}
        </button>
      ))}
    </div>
  );
}
