"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "./LocaleProvider";

/**
 * 日本語 / English の切り替え。
 * compact はスマホのヘッダー用で、ラベルを短くして幅を詰める。
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
        "chrome-pill flex items-center p-0.5 rounded-md border border-line bg-white",
        className
      )}
      role="group"
      aria-label="言語 / Language"
    >
      {(["ja", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "rounded text-xs font-bold transition-colors px-2 py-1",
            locale === l
              ? "chrome-solid bg-ink text-white"
              : "chrome-muted text-ink-muted hover:text-ink"
          )}
        >
          {l === "ja" ? (compact ? "JA" : "日本語") : "EN"}
        </button>
      ))}
    </div>
  );
}
