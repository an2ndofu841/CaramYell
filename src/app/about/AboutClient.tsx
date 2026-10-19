import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import CTASection from "@/components/home/CTASection";
import { BACKER_FEE_PERCENT, feeExample } from "@/lib/config/fees";
import { paymentMethodList } from "@/lib/config/payment-methods";

const FEE_FAQ_EXAMPLE = feeExample(1000);
const FEE_TABLE_EXAMPLE = feeExample(5000);

const USE_CASES = [
  {
    title: "生誕祭・記念日",
    description: "フラワースタンドや記念グッズ、バースデー広告など、ファンと一緒に祝う企画。",
  },
  {
    title: "周年企画・公演",
    description: "周年ライブやワンマン公演の会場費・演出費を、達成した段階に応じて実施する企画。",
  },
  {
    title: "作品・グッズの制作",
    description: "CD、ミュージックビデオ、写真集、グッズなど、完成品をリターンとして届ける企画。",
  },
];

const VALUES = [
  {
    title: "掲載者の手数料は0%",
    description: `集まった支援金から手数料を差し引くことはありません。かわりに、応援する側に支援額の${BACKER_FEE_PERCENT}%をサービス手数料としてご負担いただいています。`,
  },
  {
    title: "メールアドレスだけで応援できる",
    description:
      "応援にアカウント登録は必要ありません。100円から応援でき、デジタルリターンや体験型のリターンなら住所の入力も不要です。",
  },
  {
    title: "掲載は申し込み制",
    description:
      "芸能事務所・レーベル・運営チームからの申し込みを運営が確認し、承認した方に掲載いただいています。各プロジェクトも公開前に運営が内容を確認します。",
  },
  {
    title: "決済は Stripe を通じて",
    description:
      "お支払いは Stripe の決済画面で行われ、クレジットカードの情報は CaramYell のサーバーに保存されません。",
  },
  {
    title: "海外のファンにも",
    description:
      "サイトの表示は日本語と英語を切り替えられます。英語の文面を登録しておけば、英語表示のときにその内容が表示されます。海外発行のカードでも応援できます。",
  },
];

const FAQ_ITEMS = [
  {
    q: "手数料はどうなっていますか？",
    a: `掲載者の手数料は0%です。応援する側に${BACKER_FEE_PERCENT}%のサービス手数料をご負担いただいています。たとえば${FEE_FAQ_EXAMPLE.baseText}円のリターンで応援する場合、お支払い総額は${FEE_FAQ_EXAMPLE.totalText}円になります。`,
  },
  {
    q: "アカウントを作らなくても応援できますか？",
    a: "はい。ニックネーム（任意）とメールアドレスだけで応援できます。デジタルリターンの場合は住所の入力も不要です。",
  },
  {
    q: "目標金額に届かなかったらどうなりますか？",
    a: "支援金はお申し込み時に決済されるため、目標未達を理由とした返金は行われません。掲載者は、集まった資金の範囲で実施できる内容に調整してプロジェクトを進めます。段階ゴールが設定されている場合は、達成した段階までを実施します。",
  },
  {
    q: "プロジェクトを掲載するにはどうすればよいですか？",
    a: "掲載申し込みフォームから、事務所・団体名と予定している企画の内容をお送りください。運営が内容を確認し、承認後にプロジェクトを作成できます。作成したプロジェクトは、運営が掲載内容を確認してから公開されます。",
  },
  {
    q: "海外からでも応援できますか？",
    a: `はい。${paymentMethodList("ja")}に対応しており、海外発行のカードでも応援いただけます。決済は日本円で行われます。`,
  },
];

export default function AboutClient() {
  return (
    <div>
      {/* ヒーロー */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="eyebrow mb-6">About CaramYell</p>
          <h1
            className="text-[32px] leading-[1.3] sm:text-5xl sm:leading-[1.2] font-bold text-ink max-w-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            アーティストの企画を、
            <br />
            ファンの応援でかたちにする。
          </h1>
          <p className="mt-6 text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl">
            CaramYell は、アーティスト・アイドルの生誕祭や周年企画、作品づくりのためのクラウドファンディングです。
            芸能事務所・レーベルからの掲載を受け付けています。
          </p>
        </div>
      </section>

      {/* 成り立ち */}
      <Section eyebrow="Why" title="応援する気持ちを、企画に届けるために" tinted>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 space-y-4 text-[15px] text-ink-soft leading-relaxed">
            <p>
              生誕祭のフラワースタンドや周年ライブの演出、新しい作品の制作。アーティストの節目には、ファンが一緒に関わりたいと思う企画がたくさんあります。
            </p>
            <p>
              一方で、企画を運営する側には、支援金の管理や名前の掲載、特典の配布、発送といった手間がかかります。応援する側にとっても、手続きが面倒だと気持ちを届けにくくなります。
            </p>
            <p>
              CaramYell は、掲載者の手数料をなくし、運営に必要な作業を管理画面にまとめ、応援する側はメールアドレスだけで支援できるようにしています。
            </p>
          </div>
          <div className="lg:col-span-2">
            <p className="text-xs font-bold text-ink-muted mb-3">こんな企画に</p>
            <ul className="divide-y divide-line border-y border-line">
              {USE_CASES.map((u) => (
                <li key={u.title} className="py-4">
                  <p className="font-bold text-ink">{u.title}</p>
                  <p className="mt-1 text-sm text-ink-muted leading-relaxed">{u.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 大切にしていること */}
      <Section eyebrow="Principles" title="CaramYell の仕組み">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
          {VALUES.map((v) => (
            <div key={v.title} className="border-t border-line-strong pt-5">
              <h3 className="font-bold text-ink">{v.title}</h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 手数料 */}
      <Section eyebrow="Pricing" title="掲載者の手数料は 0% です" tinted>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="text-ink-soft leading-relaxed space-y-4 text-[15px]">
            <p>
              多くのクラウドファンディングでは、集まった金額から一定の割合が手数料として差し引かれます。CaramYell では掲載者から手数料をいただかず、
              応援する側に支援額の{BACKER_FEE_PERCENT}%をサービス手数料としてご負担いただいています。決済にかかる費用もここに含まれます。
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
              {FEE_TABLE_EXAMPLE.baseText}円のリターンで応援した場合
            </p>
            <dl className="divide-y divide-line tabular-nums">
              <FeeRow label="リターンの金額" value={`¥${FEE_TABLE_EXAMPLE.baseText}`} />
              <FeeRow
                label={`サービス手数料（${BACKER_FEE_PERCENT}%）`}
                value={`¥${FEE_TABLE_EXAMPLE.feeText}`}
              />
              <FeeRow label="お支払い総額" value={`¥${FEE_TABLE_EXAMPLE.totalText}`} />
              <FeeRow label="掲載者の受け取り" value={`¥${FEE_TABLE_EXAMPLE.baseText}`} strong />
            </dl>
          </div>
        </div>
      </Section>

      {/* 応援する方・掲載する方 */}
      <Section eyebrow="Get started" title="はじめる">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line rounded-xl overflow-hidden">
          <div className="bg-white p-6 sm:p-8 flex flex-col">
            <p className="text-xs font-bold text-ink-muted mb-2">応援したい方</p>
            <h3 className="text-lg font-bold text-ink">プロジェクトを探す</h3>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed flex-1">
              公開中のプロジェクトから、応援したい企画を選べます。応援の流れはガイドにまとめています。
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              <TextLink href="/projects">プロジェクト一覧</TextLink>
              <TextLink href="/guide#backer">応援の流れ</TextLink>
            </div>
          </div>
          <div className="bg-white p-6 sm:p-8 flex flex-col">
            <p className="text-xs font-bold text-ink-muted mb-2">事務所・レーベルの方</p>
            <h3 className="text-lg font-bold text-ink">プロジェクトを掲載する</h3>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed flex-1">
              掲載は申し込み制です。フォームからお申し込みいただくと、運営が内容を確認してご連絡します。
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              <TextLink href="/apply">掲載を申し込む</TextLink>
              <TextLink href="/for-agencies">事務所・レーベルの方へ</TextLink>
            </div>
          </div>
        </div>
      </Section>

      {/* よくある質問 */}
      <Section eyebrow="FAQ" title="よくある質問" tinted>
        <div className="rounded-xl border border-line bg-white divide-y divide-line">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex items-start justify-between gap-4 cursor-pointer px-5 sm:px-6 py-4 list-none [&::-webkit-details-marker]:hidden">
                <span className="font-bold text-ink leading-relaxed">{item.q}</span>
                <Plus
                  size={16}
                  className="flex-shrink-0 mt-1 text-ink-muted transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <div className="px-5 sm:px-6 pb-5 -mt-1">
                <p className="text-sm text-ink-soft leading-relaxed">{item.a}</p>
              </div>
            </details>
          ))}
        </div>
        <div className="mt-6">
          <TextLink href="/faq">ほかの質問を見る</TextLink>
        </div>
      </Section>

      <CTASection />
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

function FeeRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="px-6 py-3.5 flex items-center justify-between gap-4">
      <dt className={"text-sm " + (strong ? "font-bold text-ink" : "text-ink-soft")}>{label}</dt>
      <dd className={"font-bold " + (strong ? "text-lg text-caramel-700" : "text-ink")}>{value}</dd>
    </div>
  );
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-bold text-ink hover:text-caramel-600 transition-colors"
    >
      {children}
      <ArrowRight size={14} />
    </Link>
  );
}
