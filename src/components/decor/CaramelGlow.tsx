import { cn } from "@/lib/utils";

/**
 * ヒーローの背景に置く、溶けたキャラメルのような柔らかい光。
 * 文字の読みやすさを落とさないよう、色は淡く、文字の後ろには置かない。
 */
export default function CaramelGlow({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className="absolute -top-40 -right-32 w-[560px] h-[560px] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(closest-side, rgba(240, 174, 99, 0.55), rgba(240, 174, 99, 0.18) 55%, rgba(240, 174, 99, 0))",
        }}
      />
      <div
        className="absolute top-1/2 -left-48 w-[420px] h-[420px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(closest-side, rgba(248, 210, 166, 0.7), rgba(248, 210, 166, 0))",
        }}
      />
    </div>
  );
}
