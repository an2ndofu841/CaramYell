import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ORGANIZER_FEATURES } from "@/components/home/FeaturesSection";
import { BACKER_FEE_PERCENT, feeExample } from "@/lib/config/fees";

export const metadata: Metadata = {
  title: "事務所・レーベルの方へ",
  description:
    "芸能事務所・レーベル・運営チームからのプロジェクト掲載を受け付けています。掲載者の手数料は0%。生誕祭や周年企画、作品づくりの資金をファンの支援で集められます。",
  alternates: { canonical: "/for-agencies" },
};

const USE_CASES = [
  {
    title: "生誕祭・記念日の企画",
    description: "フラワースタンド、記念グッズ、特別公演など、ファンと一緒に誕生日や記念日を祝う企画に。",
  },
  {
    title: "周年ライブ・ワンマン公演",
    description: "会場費や演出の費用を支援で募り、達成した段階に応じて演出を足していく形にも対応します。",
  },
  {
    title: "作品・グッズの制作",
    description: "CD やミュージックビデオ、写真集、グッズの制作費に。リターンとして完成品を届けられます。",
  },
  {
    title: "広告・応援企画",
    description: "駅広告やバースデー広告など、ファンの名前を載せる企画も、お名前リストの機能で進めやすくなります。",
  },
];

const EXTRA_FEATURES = [
  {
    title: "公開前のプレビュー",
    description: "公開前のページを、共有用のURLで関係者に確認してもらえます。",
  },
  {
    title: "支援者限定の活動報告",
    description: "進み具合や制作の裏側を、支援してくれた人だけに公開して届けられます。",
  },
  {
    title: "送り先のCSV書き出し",
    description: "配送業者向けに、1行を1つの荷物にまとめた送り先の一覧をCSVで書き出せます。",
  },
];

const STEPS = [
  {
    title: "アカウントを作成",
    description: "メールアドレスとパスワードで CaramYell のアカウントを作ります。",
  },
  {
    title: "掲載を申し込む",
    description: "事務所名、ご担当者、予定している企画の内容をフォームから送ってください。",
  },
  {
    title: "運営が内容を確認",
    description: "内容を確認し、ご登録のメールアドレスに結果をご連絡します。必要に応じて詳細をうかがいます。",
  },
  {
    title: "プロジェクトを作成して公開",
    description: "承認後は管理画面からプロジェクトを作れます。公開前に運営が掲載内容を確認します。",
  },
];

const FAQ = [
  {
    q: "複数のアーティストの企画を掲載できますか？",
    a: "できます。1つの事務所で複数のプロジェクトを作成し、それぞれの支援状況や発送を管理できます。",
  },
  {
    q: "個人で活動しているアーティストでも申し込めますか？",
    a: "申し込めます。申請フォームの団体の種別で「個人で活動するアーティスト」を選んでください。",
  },
  {
    q: "掲載にあたって費用はかかりますか？",
    a: `掲載者の手数料はかかりません。支援する側に支援額の${BACKER_FEE_PERCENT}%のサービス手数料をご負担いただいており、決済にかかる費用もそこに含まれます。`,
  },
  {
    q: "集まった支援金はいつ受け取れますか？",
    a: "募集期間の終了後、運営から掲載者へ個別にご連絡のうえ、お渡しの手続きを行います。",
  },
  {
    q: "複数のスタッフで管理できますか？",
    a: "できます。承認されると申請したアカウントが事務所のオーナーになり、管理画面の「事務所のメンバー」からスタッフをメールで招待できます。スタッフはプロジェクトの作成・編集や支援者の管理ができ、メンバーの招待・削除とプロジェクトの削除はオーナーが行います。",
  },
];

export default function ForAgenciesPage() {
  const example = feeExample(10000);

  return (
    <div>
      {/* ヒーロー */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="eyebrow mb-6">For agencies &amp; labels</p>
          <h1
            className="text-[32px] leading-[1.3] sm:text-5xl sm:leading-[1.2] font-bold text-ink max-w-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            所属アーティストの企画を、
            <br />
            ファンと一緒に実現する。
          </h1>
          <p className="mt-6 text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl">
            CaramYell は、芸能事務所・レーベル・運営チームからのプロジェクト掲載を受け付けています。
            生誕祭や周年ライブ、作品づくりに必要な資金を、ファンの支援で集められます。
            掲載者の手数料はかかりません。
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-ink text-white text-[15px] font-bold hover:bg-ink-soft transition-colors"
            >
              掲載を申し込む
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center h-12 px-6 rounded-lg border border-line-strong bg-white text-ink text-[15px] font-bold hover:bg-cream-100 transition-colors"
            >
              まずは相談する
            </Link>
          </div>
        </div>
      </section>

      {/* 向いている企画 */}
      <Section eyebrow="Use cases" title="こんな企画に使われています">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line rounded-xl overflow-hidden">
          {USE_CASES.map((u) => (
            <div key={u.title} className="bg-white p-6 sm:p-8">
              <h3 className="font-bold text-ink text-lg">{u.title}</h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">{u.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 機能 */}
      <Section eyebrow="Features" title="運営の手間を減らす機能" tinted>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
          {[...ORGANIZER_FEATURES, ...EXTRA_FEATURES].map((f) => (
            <div key={f.title} className="border-t border-line-strong pt-5">
              <h3 className="font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 料金 */}
      <Section eyebrow="Pricing" title="掲載者の手数料は 0% です">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="text-ink-soft leading-relaxed space-y-4 text-[15px]">
            <p>
              集まった支援金から手数料を差し引くことはありません。かわりに、支援する側に支援額の
              {BACKER_FEE_PERCENT}%をサービス手数料としてご負担いただいています。決済にかかる費用もここに含まれます。
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-sm font-bold text-ink hover:text-caramel-600 transition-colors"
            >
              手数料の詳しい仕組み
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="rounded-xl border border-line bg-white">
            <p className="px-6 pt-5 pb-3 text-xs font-bold text-ink-muted">
              {example.baseText}円のリターンが選ばれた場合
            </p>
            <dl className="divide-y divide-line">
              <Row label="支援者のお支払い" value={`¥${example.totalText}`} note={`支援額 + 手数料${BACKER_FEE_PERCENT}%`} />
              <Row label="掲載者の受け取り" value={`¥${example.baseText}`} note="差し引きなし" strong />
            </dl>
          </div>
        </div>
      </Section>

      {/* 流れ */}
      <Section eyebrow="Process" title="掲載までの流れ" tinted>
        <ol className="grid grid-cols-1 md:grid-cols-4 gap-px bg-line border border-line rounded-xl overflow-hidden">
          {STEPS.map((s, i) => (
            <li key={s.title} className="bg-white p-6">
              <span className="text-sm font-bold text-caramel-600 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">{s.description}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* よくある質問 */}
      <Section eyebrow="FAQ" title="よくある質問">
        <dl className="divide-y divide-line border-y border-line">
          {FAQ.map((item) => (
            <div key={item.q} className="py-6 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-10">
              <dt className="font-bold text-ink">{item.q}</dt>
              <dd className="md:col-span-2 text-sm text-ink-soft leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* 申し込み */}
      <section className="bg-ink text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h2
              className="text-2xl sm:text-3xl font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              掲載のお申し込み
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed max-w-xl">
              フォームの入力は5分ほどで終わります。内容を確認して、ご登録のメールアドレスにご連絡します。
            </p>
          </div>
          <Link
            href="/apply"
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-white text-ink text-[15px] font-bold hover:bg-cream-100 transition-colors"
          >
            申し込みフォームへ
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  tinted = false,
  children,
}: {
  eyebrow: string;
  title: string;
  tinted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={tinted ? "py-16 sm:py-20 bg-white border-y border-line" : "py-16 sm:py-20"}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2
          className="text-2xl sm:text-[28px] font-bold text-ink mb-10"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  note,
  strong = false,
}: {
  label: string;
  value: string;
  note: string;
  strong?: boolean;
}) {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-4">
      <div>
        <dt className="text-sm font-bold text-ink">{label}</dt>
        <dd className="text-xs text-ink-muted mt-0.5">{note}</dd>
      </div>
      <dd className={"tabular-nums font-bold " + (strong ? "text-xl text-caramel-700" : "text-lg text-ink")}>
        {value}
      </dd>
    </div>
  );
}
