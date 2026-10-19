import { cn } from "@/lib/utils";

/**
 * 文字だけのロゴ。色は親の文字色を引き継ぐので、暗い面でもそのまま使える。
 * 「Yell」の下に引いた短い線だけをキャラメル色にして、ブランドの目印にしている。
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline text-[19px] font-bold tracking-tight leading-none",
        className
      )}
      style={{ fontFamily: "var(--font-display)" }}
    >
      Caram
      <span className="relative">
        Yell
        <span
          aria-hidden
          className="absolute left-0 right-0 -bottom-1 h-[3px] rounded-full bg-caramel-500"
        />
      </span>
    </span>
  );
}
