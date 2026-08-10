import Link from "next/link";
import type { Metadata } from "next";
import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { SUPPORT_EMAIL, SUPPORT_TEL } from "@/lib/config/site";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "CaramYell へのお問い合わせ窓口です。支援・リターン・アカウント・プロジェクトの掲載に関するご相談を受け付けています。",
};

const BEFORE_YOU_ASK = [
  {
    emoji: "❓",
    title: "よくある質問",
    note: "支援方法、手数料、返金、掲載の流れなど、多くのご質問はこちらで解決できます。",
    href: "/faq",
    label: "よくある質問を見る",
  },
  {
    emoji: "📚",
    title: "使い方ガイド",
    note: "応援するときの流れと、プロジェクトを掲載するまでの流れをまとめています。",
    href: "/guide",
    label: "ガイドを見る",
  },
  {
    emoji: "📢",
    title: "プロジェクトの活動報告",
    note: "リターンの進捗や発送のお知らせは、各プロジェクトページの活動報告に掲載されます。",
    href: "/projects",
    label: "プロジェクトを見る",
  },
];

export default function ContactPage() {
  return (
    <LegalPageLayout
      badge="📮 お問い合わせ"
      title="お問い合わせ"
      lead="ご不明な点やお困りごとがあれば、お気軽にご連絡ください。内容を確認のうえ、順次ご返信します。"
      width="wide"
    >
      <section className="mb-10">
        <h2 className="text-sm font-bold text-gray-700 mb-3 text-center">
          お問い合わせの前に
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {BEFORE_YOU_ASK.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-3xl bg-white border-2 border-caramel-100 p-5 hover:border-caramel-300 hover:shadow-soft transition-all flex flex-col"
            >
              <span className="text-2xl">{item.emoji}</span>
              <p className="text-sm font-bold text-gray-800 mt-2">{item.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed mt-1.5 flex-1">
                {item.note}
              </p>
              <span className="text-xs font-bold text-caramel-600 mt-3">
                {item.label} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] items-start">
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3">
            お問い合わせフォーム
          </h2>
          <ContactForm />
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border-2 border-caramel-100 bg-caramel-50/50 p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-3">
              メール・お電話でのご連絡
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">メール</dt>
                <dd>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="font-bold text-caramel-600 hover:underline break-all"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">電話</dt>
                <dd>
                  <a
                    href={`tel:${SUPPORT_TEL.replace(/-/g, "")}`}
                    className="font-bold text-caramel-600 hover:underline"
                  >
                    {SUPPORT_TEL}
                  </a>
                </dd>
              </div>
            </dl>
            <p className="text-xs text-gray-500 leading-relaxed mt-3">
              {"メールでの受付を基本としています。お電話の場合、内容によっては折り返しのご連絡となることがあります。"}
            </p>
          </div>

          <div className="rounded-3xl border-2 border-caramel-100 bg-white p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-2">
              リターンについてのご相談
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              {"リターンの企画・制作・提供は各プロジェクトの掲載者が行っています。個別の内容についてのお問い合わせは、当社が確認のうえ掲載者にお取り次ぎします。"}
            </p>
          </div>

          <div className="rounded-3xl border-2 border-caramel-100 bg-white p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-2">
              脆弱性を見つけた方へ
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              {"セキュリティ上の問題を発見された場合は、種別で「脆弱性の報告」を選んでご連絡ください。詳細が公開されると悪用のおそれがあるため、修正が完了するまで内容の公表はお控えいただけますと助かります。"}
            </p>
          </div>

          <div className="rounded-3xl border-2 border-caramel-100 bg-white p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-2">運営会社</h2>
            <div className="text-xs text-gray-500 leading-relaxed space-y-0.5">
              <p className="font-bold text-gray-700">株式会社めしあがレーベル</p>
              <p>〒150-0044</p>
              <p>東京都渋谷区円山町5番3号</p>
              <p>MIEUX渋谷ビル8階</p>
            </div>
            <Link
              href="/commercial"
              className="inline-block text-xs font-bold text-caramel-600 hover:underline mt-2"
            >
              特定商取引法に基づく表記 →
            </Link>
          </div>
        </aside>
      </div>
    </LegalPageLayout>
  );
}
