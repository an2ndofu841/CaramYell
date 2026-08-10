import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 規約・ポリシー系ページの共通の枠。
 * 特商法ページと同じ見た目に揃えたいので、余白・カード・下部の導線をここにまとめている。
 */
export default function LegalPageLayout({
  badge,
  title,
  lead,
  updatedAt,
  width = "narrow",
  children,
}: {
  badge: string;
  title: string;
  lead: ReactNode;
  /** 表示したくないページ（FAQ など）では省略できる */
  updatedAt?: string;
  /** 読み物系は narrow、カードを並べるページは wide */
  width?: "narrow" | "wide";
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-screen pt-28 pb-20 px-4 sm:px-6"
      style={{ background: "linear-gradient(180deg, #FFFBF5 0%, #FFFFFF 100%)" }}
    >
      <div className={width === "wide" ? "max-w-5xl mx-auto" : "max-w-3xl mx-auto"}>
        <header className="text-center mb-10">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
            style={{ background: "rgba(244, 123, 10, 0.1)", color: "#F47B0A" }}
          >
            {badge}
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-3">
            {title}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl mx-auto">
            {lead}
          </p>
        </header>

        {children}

        {updatedAt && (
          <p className="text-xs text-gray-400 text-center mt-8">
            最終更新日：{updatedAt}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/"
            className="px-8 py-3 rounded-full text-white font-bold btn-pop text-center"
            style={{
              background: "linear-gradient(135deg, #F2807B, #F5A34B)",
              boxShadow: "0 4px 20px rgba(242, 128, 123, 0.4)",
            }}
          >
            トップへ戻る
          </Link>
          <Link
            href="/projects"
            className="px-8 py-3 rounded-full font-bold text-gray-500 border-2 border-caramel-100 hover:bg-caramel-50 transition-colors text-center"
          >
            プロジェクトを見る
          </Link>
        </div>
      </div>
    </div>
  );
}

/** 規約の1条ぶん。`no` を省くとただの見出し付き段落になる */
export function Article({
  no,
  title,
  children,
}: {
  no?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="py-5 border-b border-caramel-100 last:border-b-0 first:pt-0">
      <h2 className="text-base font-bold text-gray-800 mb-3">
        {no && <span className="text-caramel-500 mr-2">{no}</span>}
        {title}
      </h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2.5">
        {children}
      </div>
    </section>
  );
}

/** 条文中の箇条書き。番号付きと記号付きを揃えるためだけの薄いラッパー */
export function List({
  ordered = false,
  items,
}: {
  ordered?: boolean;
  items: ReactNode[];
}) {
  const className = ordered
    ? "list-decimal pl-5 space-y-1.5 marker:text-caramel-400 marker:font-bold"
    : "list-disc pl-5 space-y-1.5 marker:text-caramel-400";
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={className}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  );
}

/** 注意書きを目立たせる枠 */
export function Callout({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border-2 border-caramel-100 bg-caramel-50/50 p-6">
      <h3 className="text-sm font-bold text-gray-700 mb-2">
        <span className="mr-2">{icon}</span>
        {title}
      </h3>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}
