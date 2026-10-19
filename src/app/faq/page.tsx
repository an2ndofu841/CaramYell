import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Plus } from "lucide-react";
import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { BACKER_FEE_PERCENT, feeExample } from "@/lib/config/fees";
import { paymentMethodList } from "@/lib/config/payment-methods";

export const metadata: Metadata = {
  title: "よくある質問",
  description:
    "CaramYell の支援方法、手数料、決済のタイミング、リターンの受け取り、プロジェクトの掲載についてよくいただく質問をまとめました。",
};

const FEE = feeExample(1000);

type FaqItem = {
  q: string;
  a: string;
  /** 答えの下に添える誘導リンク。JSON-LD には含めない */
  link?: { href: string; label: string };
};

type FaqGroup = {
  id: string;
  title: string;
  items: FaqItem[];
};

const GROUPS: FaqGroup[] = [
  {
    id: "backing",
    title: "応援するとき",
    items: [
      {
        q: "アカウント登録をしなくても応援できますか？",
        a: "はい。メールアドレスだけで応援できます。ニックネームや応援メッセージは任意です。デジタルリターンや体験型のリターンであれば、住所の入力も必要ありません。支援手続きのなかで、そのままアカウントを作ることもできます。",
      },
      {
        q: "いくらから応援できますか？",
        a: "100円から応援できます。リターンを選ばずに、好きな金額で応援することもできます。",
      },
      {
        q: "匿名で応援できますか？",
        a: "「匿名で応援する」を選ぶと、プロジェクトページにニックネームが表示されなくなります。ただし、リターンのお届けやご連絡のために、掲載者にはメールアドレスが伝わります。掲載者に一切知られずに応援することはできません。",
      },
      {
        q: "募集終了日の当日でも応援できますか？",
        a: "はい。募集終了日は「その日いっぱい」が対象です。日本時間の23時59分まで応援を受け付けます。",
      },
      {
        q: "支援した内容はあとから確認できますか？",
        a: "決済が完了すると、ご入力いただいたメールアドレス宛に確認メールをお送りします。このメールが支援内容の控えになります。アカウントをお持ちの場合は、同じメールアドレスで応援した履歴をマイページからご確認いただけます。",
      },
      {
        q: "海外からでも応援できますか？",
        a: "海外で発行されたクレジットカードでも応援いただけます。決済は日本円で行われます。海外へのリターンのお届けに対応しているかどうかは、各リターンの説明をご確認ください。サイトの表示は日本語と英語を切り替えられます。",
      },
    ],
  },
  {
    id: "payment",
    title: "お支払いと手数料",
    items: [
      {
        q: "どんな支払い方法が使えますか？",
        a: `${paymentMethodList("ja")}に対応しています。決済は Stripe を通じて行われます。`,
      },
      {
        q: "手数料はいくらかかりますか？",
        a: `掲載者の手数料は0%です。応援する側に${BACKER_FEE_PERCENT}%のサービス手数料をご負担いただいています。たとえば${FEE.baseText}円のリターンなら、お支払い総額は${FEE.totalText}円（サービス手数料${FEE.feeText}円）です。`,
        link: { href: "/pricing", label: "金額ごとの計算例を見る" },
      },
      {
        q: "いつ課金されますか？",
        a: "支援のお申し込み時に、その場で決済されます。あとからまとめて請求されることはありません。",
      },
      {
        q: "目標金額に届かなかった場合はどうなりますか？",
        a: "CaramYell では、目標金額の達成状況にかかわらず、お申し込み時に決済が行われます。目標に届かなかったことを理由とした自動的な返金はありません。掲載者は、集まった資金の範囲で実施できる内容に調整してプロジェクトを進めます。段階ゴールが設定されている場合は、達成した段階までの実施が予定になります。",
      },
      {
        q: "段階ゴールとは何ですか？",
        a: "集まった金額に応じて、実施する内容を段階的に増やしていく仕組みです。最初の目標を超えると、次の段階の内容にも取り組みます。どこまで実施されるかは達成した段階までが目安となります。",
      },
      {
        q: "クレジットカードの情報は保存されますか？",
        a: "カード番号などの決済情報は Stripe の決済画面で直接入力していただくもので、CaramYell のサーバーには送信も保存もされません。",
      },
    ],
  },
  {
    id: "reward",
    title: "リターンについて",
    items: [
      {
        q: "リターンはいつ届きますか？",
        a: "お届け予定の時期は各リターンの説明に記載しています。制作の状況などで時期が前後する場合は、掲載者からプロジェクトページの活動報告でお知らせします。",
      },
      {
        q: "住所の入力はいつ必要ですか？",
        a: "配送を伴うリターンを選んだ場合のみ必要です。デジタルリターンや体験型のリターンだけを選んだ場合、住所の入力欄は表示されません。",
      },
      {
        q: "支援したあとに配送先を変更したいです。",
        a: "発送前であれば変更できる場合があります。お問い合わせ窓口までご連絡ください。掲載者にお取り次ぎします。",
        link: { href: "/contact", label: "お問い合わせ" },
      },
      {
        q: "予定の時期を過ぎてもリターンが届きません。",
        a: "まずはプロジェクトページの活動報告をご確認ください。制作や発送の状況が掲載されている場合があります。状況がわからない場合は、お問い合わせ窓口までご連絡ください。当社から掲載者に確認します。",
        link: { href: "/contact", label: "お問い合わせ" },
      },
      {
        q: "リターンは誰が用意しているのですか？",
        a: "リターンの企画・制作・提供は、各プロジェクトの掲載者が行います。CaramYell は掲載者と応援する方をつなぐ場を提供し、決済とご連絡の窓口を担っています。",
      },
    ],
  },
  {
    id: "cancel",
    title: "キャンセル・返金",
    items: [
      {
        q: "支援をキャンセルできますか？",
        a: "支援はプロジェクトの実施を応援するものであるため、お申し込み後のお客様のご都合によるキャンセル・返金は原則として承っておりません。",
      },
      {
        q: "間違えて支援してしまいました。",
        a: "できるだけ早くお問い合わせ窓口までご連絡ください。状況を確認のうえ対応を検討します。",
        link: { href: "/contact", label: "お問い合わせ" },
      },
      {
        q: "プロジェクトが中止になった場合は？",
        a: "プロジェクトが中止された場合、またはリターンが提供されないことが確定した場合は、当社および掲載者よりご連絡のうえ、返金等の対応を行います。返金する場合は、原則としてお支払いに使われた決済手段に返金します。",
      },
      {
        q: "届いたリターンが壊れていました。",
        a: "到着後すみやかにお問い合わせ窓口までご連絡ください。掲載者と対応を確認します。",
        link: { href: "/contact", label: "お問い合わせ" },
      },
    ],
  },
  {
    id: "account",
    title: "アカウント",
    items: [
      {
        q: "ログイン方法は何がありますか？",
        a: "メールアドレスとパスワードでのログインに対応しています。登録後に届く確認メールのリンクを開くと、登録が完了します。",
      },
      {
        q: "パスワードを忘れました。",
        a: "ログイン画面の「パスワードを忘れた方」から再設定できます。ご登録のメールアドレス宛に再設定用のリンクをお送りします。",
        link: { href: "/auth/forgot-password", label: "パスワードの再設定" },
      },
      {
        q: "二段階認証は使えますか？",
        a: "はい。認証アプリを使った二段階認証（TOTP）を任意で設定できます。設定画面からご登録ください。より安全にご利用いただくためおすすめしています。",
      },
      {
        q: "メールアドレスの変更や退会をしたいです。",
        a: "現在、画面からの操作には対応していません。お問い合わせ窓口までご連絡いただければ、ご本人であることを確認のうえ対応します。",
        link: { href: "/contact", label: "お問い合わせ" },
      },
    ],
  },
  {
    id: "creator",
    title: "プロジェクトを掲載したい方へ",
    items: [
      {
        q: "誰でもプロジェクトを掲載できますか？",
        a: "掲載には運営の承認が必要です。アカウントを登録したうえで、掲載申し込みフォームから事務所・団体名や予定している企画の内容をお送りください。承認後にプロジェクトを作成でき、掲載内容の確認を経てから公開されます。",
        link: { href: "/apply", label: "掲載を申し込む" },
      },
      {
        q: "どんな人・団体が申し込めますか？",
        a: "芸能事務所・レーベル・アーティストの運営チームからの申し込みを受け付けています。個人で活動しているアーティストも申し込めます。生誕祭や周年企画、作品やグッズの制作など、アーティストの活動に関わる企画が対象です。",
        link: { href: "/for-agencies", label: "事務所・レーベルの方へ" },
      },
      {
        q: "掲載に費用はかかりますか？",
        a: "掲載は無料です。掲載者から手数料をいただくこともありません。集まった支援金は全額お渡しします。",
      },
      {
        q: "公開までどれくらいかかりますか？",
        a: "掲載の申し込みが承認されたあと、プロジェクトを作成して申請いただくと、運営が掲載内容を確認します。確認が完了しだい公開されます。内容に確認が必要な場合はご連絡することがあります。",
        link: { href: "/guide#creator", label: "掲載の流れを見る" },
      },
      {
        q: "公開したあとに内容を変更できますか？",
        a: "目標金額、募集期間、リターンの内容など、応援するかどうかの判断に関わる項目は、公開後は原則として変更できません。進捗のお知らせは、活動報告としていつでも追加できます。",
      },
      {
        q: "集まった支援金はいつ受け取れますか？",
        a: "募集期間の終了後、当社から個別にご連絡のうえ、お渡しの手続きを行います。お渡しに必要な情報もそのときに確認します。",
      },
      {
        q: "AIのサポートでは何ができますか？",
        a: "キャッチコピー、プロジェクトの説明文、ストーリー本文の下書きをAIが提案します。あくまで下書きなので、内容が正しいかどうかを必ずご自身で確認し、ご自身の言葉に直してからお使いください。",
      },
      {
        q: "英語にも対応できますか？",
        a: "プロジェクトの作成時に、タイトルや説明文などの英語のテキストを任意で入力できます。入力しておくと、閲覧者が英語表示に切り替えたときにその内容が表示されます。未入力の項目は日本語のまま表示されます。",
      },
    ],
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  ),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LegalPageLayout
        eyebrow="FAQ"
        title="よくある質問"
        lead="応援するとき、掲載するときによくいただく質問をまとめました。解決しない場合はお問い合わせください。"
      >
        <nav className="flex flex-wrap gap-x-5 gap-y-2 mb-10 text-sm">
          {GROUPS.map((group) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              className="font-bold text-ink-soft underline-offset-4 hover:text-ink hover:underline"
            >
              {group.title}
            </a>
          ))}
        </nav>

        <div className="space-y-12">
          {GROUPS.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-28">
              <h2
                className="text-xl font-bold text-ink mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {group.title}
              </h2>
              <div className="rounded-xl border border-line bg-white divide-y divide-line">
                {group.items.map((item) => (
                  <FaqEntry key={item.q} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-line bg-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="text-base font-bold text-ink mb-1">解決しませんでしたか？</h2>
            <p className="text-sm text-ink-soft leading-relaxed">
              ご不明な点は、お問い合わせ窓口からご連絡ください。内容を確認のうえご返信します。
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center h-11 px-6 rounded-full text-sm font-bold btn-caramel flex-shrink-0"
          >
            お問い合わせ
          </Link>
        </div>
      </LegalPageLayout>
    </>
  );
}

function FaqEntry({ item }: { item: FaqItem }) {
  return (
    <details className="group">
      <summary className="flex items-start justify-between gap-4 cursor-pointer px-5 sm:px-6 py-4 list-none [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-bold text-ink leading-relaxed">{item.q}</span>
        <Plus
          size={16}
          className="flex-shrink-0 mt-0.5 text-ink-muted transition-transform duration-200 group-open:rotate-45"
        />
      </summary>
      <div className="px-5 sm:px-6 pb-5 -mt-1">
        <p className="text-sm text-ink-soft leading-relaxed">{item.a}</p>
        {item.link && (
          <Link
            href={item.link.href}
            className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-ink hover:text-caramel-600 transition-colors"
          >
            {item.link.label}
            <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </details>
  );
}
