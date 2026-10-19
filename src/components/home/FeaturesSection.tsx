import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * 掲載者向けの機能紹介。生誕祭や周年企画で実際に手間がかかる作業
 * （名前の掲載、デジタル特典の配布、発送、現地での受け付け）を
 * 管理画面で片付けられることを伝える。ここに書く機能は実装済みのものだけにする。
 */
export const ORGANIZER_FEATURES = [
  {
    title: "段階ゴールとネクストゴール",
    description:
      "目標を段階に分けて、達成した段階まで実施できます。最終目標を超えたあとの追加目標も設定できます。",
  },
  {
    title: "フラスタ用のお名前リスト",
    description:
      "支援額の多い順に、同じ人の複数回の支援を合算した名前の一覧をコピーできます。",
  },
  {
    title: "デジタルリターンの一括送付",
    description:
      "ボイスや画像などのデジタル特典を、対象の支援者へまとめてメールで届けられます。",
  },
  {
    title: "発送の管理",
    description:
      "リターンごとに用意する数と送り先を一覧にし、同じ送り先への複数の支援は1つの荷物にまとめます。",
  },
  {
    title: "会場での支援の記録",
    description:
      "ライブ会場などで受け取った現金の支援も記録して、集計と達成率に反映できます。",
  },
  {
    title: "ページのデザインと英語表示",
    description:
      "アーティストの世界観に合わせて配色と書体を選べます。英語の文面を入れれば海外のファンにも届きます。",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 sm:py-24 bg-white border-t border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="eyebrow mb-3">For organizers</p>
            <h2
              className="text-2xl sm:text-[28px] font-bold text-ink leading-snug"
              style={{ fontFamily: "var(--font-display)" }}
            >
              応援企画の運営に必要なことを、
              <br className="hidden sm:block" />
              ひとつの管理画面で。
            </h2>
          </div>
          <Link
            href="/for-agencies"
            className="inline-flex items-center gap-1 text-sm font-bold text-ink hover:text-caramel-600 transition-colors whitespace-nowrap"
          >
            掲載について詳しく
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line rounded-xl overflow-hidden">
          {ORGANIZER_FEATURES.map((f) => (
            <div key={f.title} className="bg-white p-6 sm:p-7">
              <h3 className="font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
