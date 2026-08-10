import Link from "next/link";
import type { Metadata } from "next";
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
  emoji: string;
  title: string;
  items: FaqItem[];
};

const GROUPS: FaqGroup[] = [
  {
    id: "backing",
    emoji: "💛",
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
    emoji: "💳",
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
        link: { href: "/security", label: "セキュリティへの取り組み" },
      },
    ],
  },
  {
    id: "reward",
    emoji: "🎁",
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
    emoji: "🔁",
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
    emoji: "👤",
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
    emoji: "🚀",
    title: "プロジェクトを掲載したい方へ",
    items: [
      {
        q: "誰でもプロジェクトを掲載できますか？",
        a: "アカウント登録に加えて、掲載者としての利用の承認が必要です。承認後にプロジェクトを作成し、内容の審査を経てから公開されます。",
        link: { href: "/guide", label: "掲載の流れを見る" },
      },
      {
        q: "掲載に費用はかかりますか？",
        a: "掲載は無料です。掲載者から手数料をいただくこともありません。集まった支援金は全額お渡しします。",
      },
      {
        q: "公開までどれくらいかかりますか？",
        a: "プロジェクトを作成して申請いただいたあと、内容を確認する審査があります。審査が完了しだい公開されます。内容に確認が必要な場合はご連絡することがあります。",
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
        badge="❓ よくある質問"
        title="よくある質問"
        lead="応援するとき、掲載するときによくいただく質問をまとめました。解決しない場合はお気軽にお問い合わせください。"
      >
        <nav className="flex flex-wrap justify-center gap-2 mb-8">
          {GROUPS.map((group) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              className="px-4 py-2 rounded-full text-xs sm:text-sm font-bold bg-white border-2 border-caramel-100 text-gray-600 hover:border-caramel-300 hover:text-caramel-600 transition-colors"
            >
              <span className="mr-1.5">{group.emoji}</span>
              {group.title}
            </a>
          ))}
        </nav>

        <div className="space-y-10">
          {GROUPS.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-28">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-base"
                  style={{ background: "rgba(245, 163, 75, 0.15)" }}
                >
                  {group.emoji}
                </span>
                {group.title}
              </h2>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <FaqEntry key={item.q} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border-2 border-caramel-100 bg-caramel-50/50 p-6 sm:p-8 text-center">
          <p className="text-2xl mb-2">📮</p>
          <h2 className="text-base font-bold text-gray-800 mb-2">
            解決しませんでしたか？
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            {"ご不明な点は、お問い合わせ窓口からご連絡ください。内容を確認のうえご返信します。"}
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 rounded-full text-white font-bold btn-pop"
            style={{
              background: "linear-gradient(135deg, #F2807B, #F5A34B)",
              boxShadow: "0 4px 20px rgba(242, 128, 123, 0.4)",
            }}
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
    <details className="group rounded-2xl bg-white border-2 border-caramel-100 overflow-hidden">
      <summary className="flex items-center justify-between cursor-pointer px-5 sm:px-6 py-4 list-none [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-bold text-gray-800 pr-4">{item.q}</span>
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-transform duration-300 group-open:rotate-45"
          style={{ background: "rgba(245, 163, 75, 0.15)", color: "#F5A34B" }}
        >
          +
        </span>
      </summary>
      <div className="px-5 sm:px-6 pb-5 -mt-1">
        <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
        {item.link && (
          <Link
            href={item.link.href}
            className="inline-block mt-3 text-xs font-bold text-caramel-600 hover:underline"
          >
            {item.link.label} →
          </Link>
        )}
      </div>
    </details>
  );
}
