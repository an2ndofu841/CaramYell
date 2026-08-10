import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * 掲載者が書いた本文の表示。
 *
 * 生の HTML は一切通していない（rehype-raw を入れていないので react-markdown が
 * HTML ノードを捨てる）。したがって本文経由でスクリプトを差し込む余地はない。
 * URL も javascript: などを弾いたうえで http(s)/mailto だけ通す。
 *
 * 配色はサイト共通のクラスで書いてある。プロジェクトページのテーマ配下では
 * globals.css がこれらのクラスを --pt-* に読み替えるので、テーマにも追随する。
 */

/** 画像やリンクの遷移先。想定外のスキームは空にして無効化する */
function safeUrl(url: string): string {
  const cleaned = defaultUrlTransform(url);
  if (!cleaned) return "";
  // //evil.example や /\evil.example はサイト内リンクの見た目のまま
  // 外部へ飛ぶ。掲載者が偽のログイン画面へ誘導できてしまうので弾く。
  if (/^\/[/\\]/.test(cleaned)) return "";
  // https:/evil.example のようにスラッシュが足りない書き方も外部へ解決される
  if (/^https?:(?!\/\/)/i.test(cleaned)) return "";
  if (/^(https?:\/\/|mailto:|#|\/)/i.test(cleaned)) return cleaned;
  return "";
}

export default function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("text-gray-700 leading-relaxed break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeUrl}
        components={{
          // ページの h1 はプロジェクト名なので、本文の見出しはひとつ下から始める
          h1: ({ children }) => (
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mt-8 mb-3 first:mt-0">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mt-7 mb-2.5 first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-base font-bold text-gray-800 mt-6 mb-2 first:mt-0">
              {children}
            </h4>
          ),
          h4: ({ children }) => (
            <h5 className="text-sm font-bold text-gray-700 mt-5 mb-2 first:mt-0">
              {children}
            </h5>
          ),
          p: ({ children }) => (
            <p className="my-4 first:mt-0 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-gray-800">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="my-4 pl-5 list-disc space-y-1.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-4 pl-5 list-decimal space-y-1.5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-5 border-l-4 border-caramel-300 bg-caramel-50 rounded-r-xl py-2 px-4 text-gray-600">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-caramel-100" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              className="text-caramel-600 underline underline-offset-2 hover:text-caramel-700"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) =>
            typeof src === "string" && src ? (
              // 本文の画像は外部URLも書けるので next/image ではなく img で出す。
              // 参照元は送らない。
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt || ""}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="my-6 w-full rounded-2xl"
              />
            ) : null,
          code: ({ className: lang, children }) =>
            // ``` で囲んだ塊は pre 側で枠を作るので、ここでは素の文字にする
            lang?.startsWith("language-") ? (
              <code className="text-sm">{children}</code>
            ) : (
              <code className="px-1.5 py-0.5 rounded-md bg-caramel-50 text-caramel-700 text-[0.9em]">
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="my-5 p-4 rounded-2xl bg-caramel-50 overflow-x-auto text-gray-700">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-5 overflow-x-auto">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-caramel-100 bg-caramel-50 px-3 py-2 text-left font-bold text-gray-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-caramel-100 px-3 py-2 align-top">
              {children}
            </td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
