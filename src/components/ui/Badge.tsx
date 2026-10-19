import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  color?: "pink" | "caramel" | "mint" | "lavender" | "lemon" | "sky" | "gray" | "hot" | "new";
  size?: "sm" | "md";
  className?: string;
}

/**
 * 状態を示す小さなラベル。色は意味ごとに絞っている。
 * 旧来の色名（pink / lavender など）は呼び出し側に残っているので受け付けるが、
 * 見た目は近い意味の色にまとめる。
 */
export default function Badge({
  children,
  color = "caramel",
  size = "md",
  className,
}: BadgeProps) {
  const colors = {
    pink: "bg-caramel-100/70 text-caramel-700 ring-caramel-200",
    caramel: "bg-caramel-100/70 text-caramel-700 ring-caramel-200",
    mint: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    lavender: "bg-cream-100 text-ink-soft ring-line",
    lemon: "bg-amber-50 text-amber-800 ring-amber-200",
    sky: "bg-sky-50 text-sky-800 ring-sky-200",
    gray: "bg-cream-100 text-ink-muted ring-line",
    hot: "bg-ink text-white ring-ink",
    new: "bg-white text-ink ring-line-strong",
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-[11px]",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-full ring-1 ring-inset",
        colors[color],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
