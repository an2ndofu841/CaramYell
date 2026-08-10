import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import LegalPageLayout, { Callout } from "@/components/layout/LegalPageLayout";
import { BACKER_FEE_PERCENT, feeExample } from "@/lib/config/fees";
import { paymentMethodList } from "@/lib/config/payment-methods";

export const metadata: Metadata = {
  title: "ガイド",
  description:
    "CaramYell の使い方ガイド。プロジェクトの応援のしかたと、プロジェクトを掲載して資金を集めるまでの流れを順を追って説明します。",
};

const FEE = feeExample(3000);

type Step = {
  title: string;
  body: ReactNode;
};

const BACKER_STEPS: Step[] = [
  {
    title: "応援したいプロジェクトを探す",
    body: (
      <>
        <p>
          {"プロジェクト一覧から、気になる企画を探します。それぞれのページには、企画の内容、集まっている金額、募集の残り日数、用意されているリターンが載っています。"}
        </p>
        <p>
          {"段階ゴールが設定されているプロジェクトでは、いくら集まるとどこまで実施されるのかを確認できます。"}
        </p>
      </>
    ),
  },
  {
    title: "リターンを選ぶ",
    body: (
      <>
        <p>
          {"受け取りたいリターンを選びます。リターンを選ばずに、100円以上の好きな金額で応援することもできます。"}
        </p>
        <p className="text-xs text-gray-400">
          {"数量に上限があるリターンは、上限に達すると選べなくなります。"}
        </p>
      </>
    ),
  },
  {
    title: "情報を入力する",
    body: (
      <>
        <p>
          {"必要なのはメールアドレスだけです。ニックネームと応援メッセージは任意で、匿名で応援することもできます。"}
        </p>
        <p>
          {"配送を伴うリターンを選んだ場合のみ、お届け先を入力します。郵便番号を入れると住所が自動で補完されます。"}
        </p>
        <p>
          {"ここで、あわせてアカウントを作ることもできます。作っておくと、応援した履歴をマイページで確認できます。"}
        </p>
      </>
    ),
  },
  {
    title: "お支払いをする",
    body: (
      <>
        <p>
          {`Stripe の決済画面に移動してお支払いします。${paymentMethodList("ja")}がご利用いただけます。`}
        </p>
        <p>
          {`お支払い額は、支援額に${BACKER_FEE_PERCENT}%のサービス手数料を加えた金額です。たとえば${FEE.baseText}円のリターンなら、合計${FEE.totalText}円になります。`}
        </p>
      </>
    ),
  },
  {
    title: "確認メールを受け取る",
    body: (
      <p>
        {"決済が完了すると、ご入力のメールアドレス宛に確認メールが届きます。支援内容の控えになりますので、大切に保管してください。"}
      </p>
    ),
  },
  {
    title: "リターンを受け取る",
    body: (
      <>
        <p>
          {"リターンは、各リターンに記載されたお届け予定時期に掲載者から届きます。準備の様子や発送のお知らせは、プロジェクトページの活動報告で確認できます。"}
        </p>
      </>
    ),
  },
];

const CREATOR_STEPS: Step[] = [
  {
    title: "アカウントを登録する",
    body: (
      <p>
        {"メールアドレスとパスワードで登録します。届いた確認メールのリンクを開くと、登録が完了します。"}
      </p>
    ),
  },
  {
    title: "掲載者として承認を受ける",
    body: (
      <>
        <p>
          {"プロジェクトを作るには、掲載者としての利用の承認が必要です。ご希望の方はお問い合わせ窓口からご連絡ください。"}
        </p>
      </>
    ),
  },
  {
    title: "プロジェクトを作る",
    body: (
      <>
        <p>
          {"作成画面は6つのステップに分かれています。途中で下書きとして保存できるので、一度にすべてを書き上げる必要はありません。"}
        </p>
        <ol className="list-decimal pl-5 space-y-1 marker:text-caramel-400 marker:font-bold text-xs sm:text-sm">
          <li>基本情報（タイトル、カテゴリー、メイン画像、公開URL）</li>
          <li>プロジェクト詳細（キャッチコピー、説明、ストーリー本文）</li>
          <li>段階ゴール・期間（目標金額と募集終了日）</li>
          <li>リターン設定（金額、内容、数量、お届け時期）</li>
          <li>デザイン（ページの配色テーマ）</li>
          <li>確認・送信</li>
        </ol>
        <p className="text-xs text-gray-400">
          {"キャッチコピー・説明文・ストーリーは、AIに下書きを提案させることもできます。提案はそのまま使わず、内容を確認してご自身の言葉に整えてください。"}
        </p>
      </>
    ),
  },
  {
    title: "審査に出す",
    body: (
      <>
        <p>
          {"内容がそろったら申請します。当社が内容を確認し、問題がなければ公開されます。確認が必要な点があればご連絡します。"}
        </p>
        <p className="text-xs text-gray-400">
          {"公開前でも「関係者プレビューリンク」を使えば、完成イメージを関係者に共有できます。"}
        </p>
      </>
    ),
  },
  {
    title: "公開して応援を集める",
    body: (
      <>
        <p>
          {"公開されたら、SNSなどでプロジェクトのURLを共有しましょう。募集期間中は、活動報告で進捗を伝えることが応援につながります。"}
        </p>
        <p className="text-xs text-gray-400">
          {"公開後は、目標金額・募集期間・リターンの内容など、応援するかどうかの判断に関わる項目は変更できません。申請前によくご確認ください。"}
        </p>
      </>
    ),
  },
  {
    title: "リターンを届け、支援金を受け取る",
    body: (
      <>
        <p>
          {"管理画面から、応援してくださった方の一覧とお届け先を確認し、発送状況を記録できます。"}
        </p>
        <p>
          {"集まった支援金は、募集期間の終了後に当社から個別にご連絡のうえお渡しします。掲載者から手数料をいただくことはありません。"}
        </p>
      </>
    ),
  },
];

export default function GuidePage() {
  return (
    <LegalPageLayout
      badge="📚 ガイド"
      title="CaramYellの使い方"
      lead="はじめての方に向けて、応援するときの流れと、プロジェクトを掲載するときの流れをまとめました。"
      width="wide"
    >
      <div className="grid gap-4 sm:grid-cols-2 mb-12">
        <JumpCard
          href="#backer"
          emoji="💛"
          title="応援したい方へ"
          note="アカウント登録なし・100円から"
          color="#F2807B"
        />
        <JumpCard
          href="#creator"
          emoji="🚀"
          title="掲載したい方へ"
          note="掲載無料・掲載者の手数料0%"
          color="#8FD4C4"
        />
      </div>

      <section id="backer" className="scroll-mt-28 mb-16">
        <SectionHeading
          emoji="💛"
          title="プロジェクトを応援する"
          lead="アカウント登録は不要です。メールアドレスだけで、100円から応援できます。"
          color="#F2807B"
        />
        <StepList steps={BACKER_STEPS} color="#F2807B" />

        <div className="mt-6">
          <Callout icon="⚠️" title="応援する前に知っておいてほしいこと">
            <p>
              {"支援金は、目標金額に届いたかどうかにかかわらず、お申し込み時にその場で決済されます。目標未達を理由とした自動的な返金はありません。"}
            </p>
            <p>
              {"また、お申し込み後のお客様のご都合によるキャンセルは原則として承っておりません。リターンの内容とお届け予定時期をよくご確認のうえ、応援をお願いします。"}
            </p>
          </Callout>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/projects"
            className="inline-block px-8 py-3 rounded-full text-white font-bold btn-pop"
            style={{
              background: "linear-gradient(135deg, #F2807B, #F5A34B)",
              boxShadow: "0 4px 20px rgba(242, 128, 123, 0.4)",
            }}
          >
            プロジェクトを探す
          </Link>
        </div>
      </section>

      <section id="creator" className="scroll-mt-28">
        <SectionHeading
          emoji="🚀"
          title="プロジェクトを掲載する"
          lead="掲載は無料。掲載者から手数料はいただかず、集まった支援金は全額お渡しします。"
          color="#8FD4C4"
        />
        <StepList steps={CREATOR_STEPS} color="#8FD4C4" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Callout icon="✏️" title="応援が集まりやすいプロジェクトのコツ">
            <ul className="list-disc pl-5 space-y-1.5 marker:text-caramel-400">
              <li>なぜやりたいのかを、自分の言葉で具体的に書く</li>
              <li>集めた資金の使い道を項目ごとに示す</li>
              <li>写真を入れて、雰囲気が伝わるようにする</li>
              <li>手に取りやすい価格から、思い切った価格まで幅を持たせる</li>
              <li>公開後も活動報告をこまめに更新する</li>
            </ul>
          </Callout>
          <Callout icon="🚫" title="掲載できない企画">
            <p>
              {"金銭的なリターンを約束するもの、現金や金券をリターンとするもの、許認可が必要な物品を許可なく扱うものなどは掲載できません。"}
            </p>
            <p>
              <Link href="/terms" className="font-bold text-caramel-600 hover:underline">
                利用規約 第10条
              </Link>
              {"に一覧を記載しています。"}
            </p>
          </Callout>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/contact"
            className="inline-block px-8 py-3 rounded-full font-bold text-gray-600 border-2 border-caramel-100 bg-white hover:bg-caramel-50 transition-colors"
          >
            掲載について相談する
          </Link>
        </div>
      </section>
    </LegalPageLayout>
  );
}

function JumpCard({
  href,
  emoji,
  title,
  note,
  color,
}: {
  href: string;
  emoji: string;
  title: string;
  note: string;
  color: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-3xl bg-white p-6 border-2 transition-all hover:shadow-soft"
      style={{ borderColor: `${color}30` }}
    >
      <div className="flex items-center gap-4">
        <span
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${color}20` }}
        >
          {emoji}
        </span>
        <div>
          <p className="text-base font-bold text-gray-800">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{note}</p>
        </div>
      </div>
    </a>
  );
}

function SectionHeading({
  emoji,
  title,
  lead,
  color,
}: {
  emoji: string;
  title: string;
  lead: string;
  color: string;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-3 mb-2">
        <span
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
          style={{ background: `${color}20` }}
        >
          {emoji}
        </span>
        {title}
      </h2>
      <p className="text-sm text-gray-500 leading-relaxed">{lead}</p>
    </div>
  );
}

function StepList({ steps, color }: { steps: Step[]; color: string }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, i) => (
        <li
          key={step.title}
          className="relative rounded-3xl bg-white border-2 border-caramel-100 p-5 sm:p-6"
        >
          <div className="flex gap-4">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
              style={{ background: color }}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-gray-800 mb-2">
                {step.title}
              </h3>
              <div className="text-sm text-gray-600 leading-relaxed space-y-2">
                {step.body}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
