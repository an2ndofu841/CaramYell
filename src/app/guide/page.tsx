import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
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
        <p className="text-xs text-ink-muted">
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
        メールアドレスとパスワードで登録します。届いた確認メールのリンクを開くと、登録が完了します。
      </p>
    ),
  },
  {
    title: "掲載を申し込む",
    body: (
      <>
        <p>
          プロジェクトを掲載するには、運営の承認が必要です。
          <Link href="/apply" className="font-bold text-ink underline underline-offset-2 hover:text-caramel-600">
            掲載申し込みフォーム
          </Link>
          から、事務所・団体名、ご担当者、予定している企画の内容をお送りください。
        </p>
        <p className="text-xs text-ink-muted">
          芸能事務所・レーベル・運営チームのほか、個人で活動しているアーティストも申し込めます。
        </p>
      </>
    ),
  },
  {
    title: "運営の確認を待つ",
    body: (
      <p>
        運営が内容を確認し、ご登録のメールアドレスに結果をご連絡します。承認されると、管理画面からプロジェクトを作れるようになります。
      </p>
    ),
  },
  {
    title: "プロジェクトを作る",
    body: (
      <>
        <p>
          作成画面は6つのステップに分かれています。途中で下書きとして保存できるので、一度にすべてを書き上げる必要はありません。
        </p>
        <ol className="list-decimal pl-5 space-y-1 marker:text-ink-muted text-xs sm:text-sm">
          <li>基本情報（タイトル、カテゴリー、メイン画像、公開URL）</li>
          <li>プロジェクト詳細（キャッチコピー、説明、ストーリー本文）</li>
          <li>段階ゴール・期間（目標金額と募集終了日）</li>
          <li>リターン設定（金額、内容、数量、お届け時期）</li>
          <li>デザイン（ページの配色テーマ）</li>
          <li>確認・送信</li>
        </ol>
        <p className="text-xs text-ink-muted">
          キャッチコピー・説明文・ストーリーは、AIに下書きを提案させることもできます。提案はそのまま使わず、内容を確認してご自身の言葉に整えてください。
        </p>
      </>
    ),
  },
  {
    title: "掲載内容の確認を受ける",
    body: (
      <>
        <p>
          内容がそろったら申請します。運営が掲載内容を確認し、問題がなければ公開されます。確認が必要な点があればご連絡します。
        </p>
        <p className="text-xs text-ink-muted">
          公開前でも「関係者プレビューリンク」を使えば、完成イメージを関係者に共有できます。
        </p>
      </>
    ),
  },
  {
    title: "公開して応援を集める",
    body: (
      <>
        <p>
          公開されたら、SNSなどでプロジェクトのURLを共有しましょう。募集期間中は、活動報告で進み具合を伝えることが応援につながります。
        </p>
        <p className="text-xs text-ink-muted">
          公開後は、目標金額・募集期間・リターンの内容など、応援するかどうかの判断に関わる項目は変更できません。申請前によくご確認ください。
        </p>
      </>
    ),
  },
  {
    title: "リターンを届け、支援金を受け取る",
    body: (
      <>
        <p>
          管理画面から、応援してくださった方の一覧とお届け先を確認し、発送状況を記録できます。
        </p>
        <p>
          集まった支援金は、募集期間の終了後に当社から個別にご連絡のうえお渡しします。掲載者から手数料をいただくことはありません。
        </p>
      </>
    ),
  },
];

export default function GuidePage() {
  return (
    <LegalPageLayout
      eyebrow="Guide"
      title="CaramYellの使い方"
      lead="はじめての方に向けて、応援するときの流れと、プロジェクトを掲載するときの流れをまとめました。"
      width="wide"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line rounded-xl overflow-hidden mb-14">
        <JumpCard href="#backer" title="応援したい方へ" note="アカウント登録なし・100円から" />
        <JumpCard href="#creator" title="掲載したい方へ" note="申し込み制・掲載者の手数料0%" />
      </div>

      <section id="backer" className="scroll-mt-28 mb-16">
        <SectionHeading
          eyebrow="For fans"
          title="プロジェクトを応援する"
          lead="アカウント登録は不要です。メールアドレスだけで、100円から応援できます。"
        />
        <StepList steps={BACKER_STEPS} />

        <div className="mt-6">
          <Callout title="応援する前に知っておいてほしいこと">
            <p>
              支援金は、目標金額に届いたかどうかにかかわらず、お申し込み時にその場で決済されます。目標未達を理由とした自動的な返金はありません。
            </p>
            <p>
              また、お申し込み後のお客様のご都合によるキャンセルは原則として承っておりません。リターンの内容とお届け予定時期をよくご確認のうえ、応援をお願いします。
            </p>
          </Callout>
        </div>

        <div className="mt-6">
          <Link
            href="/projects"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-ink text-white text-sm font-bold hover:bg-ink-soft transition-colors"
          >
            プロジェクトを探す
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section id="creator" className="scroll-mt-28">
        <SectionHeading
          eyebrow="For agencies & artists"
          title="プロジェクトを掲載する"
          lead="掲載は申し込み制です。運営の承認後にプロジェクトを作成できます。掲載者から手数料はいただかず、集まった支援金は全額お渡しします。"
        />
        <StepList steps={CREATOR_STEPS} />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Callout title="応援が集まりやすいプロジェクトのコツ">
            <ul className="list-disc pl-5 space-y-1.5 marker:text-ink-faint">
              <li>なぜやりたいのかを、自分の言葉で具体的に書く</li>
              <li>集めた資金の使い道を項目ごとに示す</li>
              <li>写真を入れて、雰囲気が伝わるようにする</li>
              <li>手に取りやすい価格から、思い切った価格まで幅を持たせる</li>
              <li>公開後も活動報告をこまめに更新する</li>
            </ul>
          </Callout>
          <Callout title="掲載できない企画">
            <p>
              金銭的なリターンを約束するもの、現金や金券をリターンとするもの、許認可が必要な物品を許可なく扱うものなどは掲載できません。
            </p>
            <p>
              <Link href="/terms" className="font-bold text-ink underline underline-offset-2 hover:text-caramel-600">
                利用規約 第10条
              </Link>
              に一覧を記載しています。
            </p>
          </Callout>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/apply"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-ink text-white text-sm font-bold hover:bg-ink-soft transition-colors"
          >
            掲載を申し込む
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/for-agencies"
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-line-strong bg-white text-ink text-sm font-bold hover:bg-cream-100 transition-colors"
          >
            事務所・レーベルの方へ
          </Link>
        </div>
      </section>
    </LegalPageLayout>
  );
}

function JumpCard({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between gap-4 bg-white p-6 hover:bg-cream-50 transition-colors"
    >
      <span>
        <span className="block text-base font-bold text-ink">{title}</span>
        <span className="block text-xs text-ink-muted mt-1">{note}</span>
      </span>
      <ArrowDown size={16} className="text-ink-muted group-hover:text-ink transition-colors flex-shrink-0" />
    </a>
  );
}

function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead: string;
}) {
  return (
    <div className="mb-8">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h2
        className="text-xl sm:text-2xl font-bold text-ink mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <p className="text-sm text-ink-soft leading-relaxed">{lead}</p>
    </div>
  );
}

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="rounded-xl border border-line bg-white divide-y divide-line">
      {steps.map((step, i) => (
        <li key={step.title} className="p-5 sm:p-6">
          <div className="flex gap-4 sm:gap-6">
            <span className="w-7 text-sm font-bold text-caramel-600 tabular-nums flex-shrink-0 pt-px">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-ink mb-2">{step.title}</h3>
              <div className="text-sm text-ink-soft leading-relaxed space-y-2">{step.body}</div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
