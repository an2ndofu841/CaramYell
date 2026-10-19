import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
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
    title: "よくある質問",
    note: "支援方法、手数料、返金、掲載の流れなど、多くのご質問はこちらで解決できます。",
    href: "/faq",
    label: "よくある質問を見る",
  },
  {
    title: "使い方ガイド",
    note: "応援するときの流れと、プロジェクトを掲載するまでの流れをまとめています。",
    href: "/guide",
    label: "ガイドを見る",
  },
  {
    title: "プロジェクトの活動報告",
    note: "リターンの進捗や発送のお知らせは、各プロジェクトページの活動報告に掲載されます。",
    href: "/projects",
    label: "プロジェクトを見る",
  },
];

export default function ContactPage() {
  return (
    <LegalPageLayout
      eyebrow="Contact"
      title="お問い合わせ"
      lead="ご不明な点やお困りごとがあれば、こちらからご連絡ください。内容を確認のうえ、順次ご返信します。"
      width="wide"
    >
      <section className="mb-12">
        <h2 className="text-xs font-bold text-ink-muted mb-3">お問い合わせの前に</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border border-line rounded-xl overflow-hidden">
          {BEFORE_YOU_ASK.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white p-5 hover:bg-cream-50 transition-colors flex flex-col"
            >
              <p className="text-sm font-bold text-ink">{item.title}</p>
              <p className="text-xs text-ink-muted leading-relaxed mt-1.5 flex-1">{item.note}</p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-ink group-hover:text-caramel-600 mt-3 transition-colors">
                {item.label}
                <ArrowRight size={12} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] items-start">
        <div>
          <h2
            className="text-xl font-bold text-ink mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            お問い合わせフォーム
          </h2>
          <ContactForm />
        </div>

        <aside className="rounded-xl border border-line bg-white divide-y divide-line">
          <div className="p-6">
            <h2 className="text-sm font-bold text-ink mb-3">メール・お電話でのご連絡</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-ink-muted mb-0.5">メール</dt>
                <dd>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="font-bold text-ink underline underline-offset-2 hover:text-caramel-600 break-all"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted mb-0.5">電話</dt>
                <dd>
                  <a
                    href={`tel:${SUPPORT_TEL.replace(/-/g, "")}`}
                    className="font-bold text-ink underline underline-offset-2 hover:text-caramel-600 tabular-nums"
                  >
                    {SUPPORT_TEL}
                  </a>
                </dd>
              </div>
            </dl>
            <p className="text-xs text-ink-muted leading-relaxed mt-3">
              メールでの受付を基本としています。お電話の場合、内容によっては折り返しのご連絡となることがあります。
            </p>
          </div>

          <div className="p-6">
            <h2 className="text-sm font-bold text-ink mb-2">プロジェクトの掲載について</h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              芸能事務所・レーベル・アーティストの運営チームからの掲載を受け付けています。お申し込みは専用のフォームからどうぞ。
            </p>
            <Link
              href="/apply"
              className="inline-flex items-center gap-1 text-xs font-bold text-ink hover:text-caramel-600 mt-2 transition-colors"
            >
              掲載を申し込む
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="p-6">
            <h2 className="text-sm font-bold text-ink mb-2">リターンについてのご相談</h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              リターンの企画・制作・提供は各プロジェクトの掲載者が行っています。個別の内容についてのお問い合わせは、当社が確認のうえ掲載者にお取り次ぎします。
            </p>
          </div>

          <div className="p-6">
            <h2 className="text-sm font-bold text-ink mb-2">脆弱性を見つけた方へ</h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              セキュリティ上の問題を発見された場合は、種別で「脆弱性の報告」を選んでご連絡ください。詳細が公開されると悪用のおそれがあるため、修正が完了するまで内容の公表はお控えいただけますと助かります。
            </p>
          </div>

          <div className="p-6">
            <h2 className="text-sm font-bold text-ink mb-2">運営会社</h2>
            <div className="text-xs text-ink-muted leading-relaxed space-y-0.5">
              <p className="font-bold text-ink">株式会社めしあがレーベル</p>
              <p>〒150-0044</p>
              <p>東京都渋谷区円山町5番3号</p>
              <p>MIEUX渋谷ビル8階</p>
            </div>
            <Link
              href="/commercial"
              className="inline-flex items-center gap-1 text-xs font-bold text-ink hover:text-caramel-600 mt-2 transition-colors"
            >
              特定商取引法に基づく表記
              <ArrowRight size={12} />
            </Link>
          </div>
        </aside>
      </div>
    </LegalPageLayout>
  );
}
