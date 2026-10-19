import { cn } from "@/lib/utils";

/**
 * ロゴ。キャラメルの粒（角の丸い四角に艶とソースのしずく）のマークと、
 * 丸ゴシックの文字を並べる。文字色は親の文字色を引き継ぐので、暗い面でも使える。
 * 「Yell」だけをキャラメル色にして、キャラメル＋エールの語呂を見せる。
 */
export default function Logo({
  className,
  withMark = true,
}: {
  className?: string;
  withMark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[20px] font-bold tracking-tight leading-none",
        className
      )}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {withMark && <CaramelMark className="w-[26px] h-[26px] flex-shrink-0" />}
      <span>
        Caram<span className="text-caramel-500">Yell</span>
      </span>
    </span>
  );
}

/** キャラメルの粒のマーク。上面の照り返しと、下辺から垂れるソースのしずく */
export function CaramelMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="cy-mark-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F0AE63" />
          <stop offset="0.5" stopColor="#C46E2B" />
          <stop offset="1" stopColor="#8E4C1C" />
        </linearGradient>
      </defs>
      {/* 粒の本体と、下辺から垂れるしずく */}
      <path
        fill="url(#cy-mark-body)"
        d="M9 3h14a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6h-1.2c-.9 0-1.3.6-1.3 1.4v.6a2 2 0 0 1-4 0v-.9c0-.6-.5-1.1-1.1-1.1H9a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6Z"
      />
      {/* 上面の照り返し */}
      <path
        fill="#fff"
        opacity="0.45"
        d="M8.5 6.5h9a1.6 1.6 0 0 1 0 3.2h-9a1.6 1.6 0 0 1 0-3.2Z"
      />
      <circle cx="22.5" cy="8.1" r="1.6" fill="#fff" opacity="0.45" />
    </svg>
  );
}
