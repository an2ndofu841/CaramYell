import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 規約・ポリシー・案内系ページの共通の枠。
 * 特商法ページと同じ見た目に揃えたいので、余白・見出し・下部の導線をここにまとめている。
 */
export default function LegalPageLayout({
  eyebrow,
  title,
  lead,
  updatedAt,
  width = "narrow",
  children,
}: {
  /** 見出しの上に出す小さな英字ラベル（例: "Terms"） */
  eyebrow: string;
  title: string;
  lead: ReactNode;
  /** 表示したくないページ（FAQ など）では省略できる */
  updatedAt?: string;
  /** 読み物系は narrow、カードを並べるページは wide */
  width?: "narrow" | "wide";
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className={width === "wide" ? "max-w-5xl mx-auto" : "max-w-3xl mx-auto"}>
        <header className="mb-10 pb-8 border-b border-line">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h1
            className="text-3xl sm:text-4xl font-bold text-ink mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          <p className="text-[15px] text-ink-soft leading-relaxed max-w-2xl">{lead}</p>
        </header>

        {children}

        {updatedAt && (
          <p className="text-xs text-ink-muted mt-8">最終更新日：{updatedAt}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-12 pt-8 border-t border-line">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-11 px-6 rounded-full text-sm font-bold btn-caramel"
          >
            トップへ戻る
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-line-strong bg-white text-ink text-sm font-bold hover:bg-cream-100 transition-colors"
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
    <section className="py-6 border-b border-line last:border-b-0 first:pt-0">
      <h2 className="text-base font-bold text-ink mb-3">
        {no && <span className="text-ink-muted font-semibold mr-2 tabular-nums">{no}</span>}
        {title}
      </h2>
      <div className="text-sm text-ink-soft leading-relaxed space-y-2.5">{children}</div>
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
    ? "list-decimal pl-5 space-y-1.5 marker:text-ink-muted"
    : "list-disc pl-5 space-y-1.5 marker:text-ink-faint";
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={className}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  );
}

/** 注意書きを目立たせる枠。左の線だけで区切り、色は使いすぎない */
export function Callout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-5 sm:p-6 border-l-[3px] border-l-caramel-600">
      <h3 className="text-sm font-bold text-ink mb-2">{title}</h3>
      <div className="text-sm text-ink-soft leading-relaxed space-y-2">{children}</div>
    </div>
  );
}
