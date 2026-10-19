import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** 事務所・レーベルへの掲載の呼びかけ。トップと紹介ページの末尾に置く */
export default function CTASection() {
  return (
    <section className="bg-ink text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-end">
          <div className="lg:col-span-3">
            <p className="text-xs font-bold tracking-[0.12em] uppercase text-caramel-300 mb-4">
              For agencies &amp; labels
            </p>
            <h2
              className="text-2xl sm:text-4xl font-bold leading-snug"
              style={{ fontFamily: "var(--font-display)" }}
            >
              所属アーティストの企画を、
              <br />
              CaramYellで始めませんか。
            </h2>
            <p className="mt-5 text-sm sm:text-base text-white/70 leading-relaxed max-w-xl">
              芸能事務所・レーベル・運営チームからの掲載を受け付けています。
              申し込み後、運営が内容を確認して掲載用のアカウントを有効にします。
              掲載者の手数料はかかりません。
            </p>
          </div>
          <div className="lg:col-span-2 flex flex-col sm:flex-row lg:justify-end gap-3">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-white text-ink text-[15px] font-bold hover:bg-cream-100 transition-colors"
            >
              掲載を申し込む
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/for-agencies"
              className="inline-flex items-center justify-center h-12 px-6 rounded-lg border border-white/25 text-white text-[15px] font-bold hover:bg-white/10 transition-colors"
            >
              詳しく見る
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
