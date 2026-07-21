import Link from "next/link";

/**
 * 未作成ページ用の共通「準備中」プレースホルダー。
 * フッター等からリンクされているが未実装のルートの 404 を防ぐ。
 */
export default function PlaceholderPage({
  emoji,
  title,
  description,
  note,
}: {
  emoji: string;
  title: string;
  description: string;
  note?: string;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center pt-20 pb-16 px-4"
      style={{ background: "linear-gradient(135deg, #FFFBF5 0%, #FFF5E6 100%)" }}
    >
      <div className="text-center max-w-md">
        <div
          className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-candy"
          style={{ background: "linear-gradient(135deg, #F5A34B, #8FD4C4)" }}
        >
          {emoji}
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">{title}</h1>
        <p className="text-gray-500 leading-relaxed mb-2">{description}</p>
        <p className="text-sm text-gray-400 mb-8">
          このページは現在準備中です。公開までもうしばらくお待ちください。
        </p>
        {note && (
          <p className="text-xs text-gray-400 mb-8 -mt-4">{note}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-8 py-3 rounded-full text-white font-bold btn-pop"
            style={{
              background: "linear-gradient(135deg, #F2807B, #F5A34B)",
              boxShadow: "0 4px 20px rgba(242, 128, 123, 0.4)",
            }}
          >
            トップへ戻る
          </Link>
          <Link
            href="/projects"
            className="px-8 py-3 rounded-full font-bold text-gray-500 border-2 border-caramel-100 hover:bg-caramel-50 transition-colors"
          >
            プロジェクトを見る
          </Link>
        </div>
      </div>
    </div>
  );
}
