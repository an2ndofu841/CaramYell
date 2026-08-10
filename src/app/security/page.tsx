import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import LegalPageLayout, { Callout } from "@/components/layout/LegalPageLayout";
import { SUPPORT_EMAIL, SITE_DOMAIN } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "セキュリティ",
  description:
    "CaramYell が実施している、決済・通信・アカウント・データ保護に関するセキュリティ対策と、脆弱性報告の受付についてご案内します。",
};

/** 内容を見直した日。対策を追加したらここも更新する */
const UPDATED_AT = "2026年8月11日";

type Pillar = {
  emoji: string;
  title: string;
  lead: string;
  color: string;
  points: string[];
};

const PILLARS: Pillar[] = [
  {
    emoji: "💳",
    title: "決済",
    lead: "カード情報は当社が受け取りません。",
    color: "#F2807B",
    points: [
      "お支払いは決済代行会社 Stripe の決済画面で行います。カード番号・有効期限・セキュリティコードは当社のサーバーを経由せず、保存もしません。",
      "不正利用が疑われる取引では、カード会社および Stripe の判断により本人認証（3Dセキュア）が求められます。",
      "決済結果の通知は、Stripe から送られたものであることを署名で検証してから処理します。",
      "同じ決済が二重に記録されないよう、決済ごとに一意の識別子で重複を防いでいます。",
      "本番環境がテスト用の決済設定で動作しないよう、起動時に確認しています。",
    ],
  },
  {
    emoji: "🔒",
    title: "通信とブラウザ",
    lead: "経路上の盗み見と、ページの悪用を防ぎます。",
    color: "#F5A34B",
    points: [
      "すべての通信を HTTPS で暗号化しています。あわせて HSTS を設定し、暗号化されていない接続に切り替わることを防いでいます。",
      "コンテンツセキュリティポリシー（CSP）により、読み込むスクリプトや接続先を必要なものだけに制限しています。",
      "他サイトへの埋め込み（クリックジャッキング）を禁止しています。",
      "ファイルの種類の誤解釈を防ぐ設定、外部サイトへ余計な情報を渡さない参照元ポリシー、カメラ・マイク・位置情報を使わせない権限ポリシーを適用しています。",
    ],
  },
  {
    emoji: "👤",
    title: "アカウント",
    lead: "パスワードは当社にも見えません。",
    color: "#8FD4C4",
    points: [
      "パスワードは認証基盤側でハッシュ化して保管され、当社が元のパスワードを知ることはできません。",
      "アカウント登録にはメールアドレスの確認が必要です。確認が済むまでログインできません。",
      "認証アプリを使った二段階認証（TOTP）を、どなたでも任意で設定できます。",
      "運営用の管理画面は、管理者権限に加えて二段階認証の通過を必須としています。画面だけでなく、管理用のすべてのAPIでも同じ条件を確認しています。",
    ],
  },
  {
    emoji: "🗄️",
    title: "データの保護",
    lead: "見えてよいものだけが見えるようにしています。",
    color: "#C9A87C",
    points: [
      "データベースでは行単位のアクセス制御を有効にし、利用者ごとに参照・更新できる範囲を制限しています。下書き中のプロジェクトや支援者の情報は、権限のない利用者からは参照できません。",
      "公開ページやAPIでは、必要な項目だけを明示して取得しています。プレビュー用のURLに使う値など、内部で使う項目が公開側に混ざらないようにしています。",
      "公開中のプロジェクトについて、目標金額や募集期間といった条件が後から書き換えられないよう、データベース側でも変更を拒否しています。",
      "権限の自己昇格ができないよう、利用者自身による役割の変更を禁止しています。",
    ],
  },
  {
    emoji: "✍️",
    title: "投稿内容の取り扱い",
    lead: "書き込みからページを乗っ取らせません。",
    color: "#8B6DB5",
    points: [
      "利用者が入力した文章は HTML として解釈しません。本文に埋め込まれたスクリプトが動くことはありません。",
      "本文中のリンクは、http・https・メールアドレスへのリンクのみを許可し、それ以外は無効化します。外部リンクには別タブで開く安全な属性を付与しています。",
      "プロジェクトページの配色テーマは、指定できる値の形式を検証したうえで適用しています。",
      "画像のアップロードは、形式（PNG・JPEG・WebP・GIF）と容量を検証しています。",
    ],
  },
  {
    emoji: "🛡️",
    title: "不正利用への対策",
    lead: "自動化された攻撃のコストを上げます。",
    color: "#E8842C",
    points: [
      "決済手続き、画像のアップロード、AIによる文章生成、お問い合わせなど、負荷や費用が発生する操作には回数制限を設けています。",
      "ログイン後の遷移先を検証し、外部サイトへ誘導される不正なリンクを無効化しています。",
      "決済に使う秘密鍵やデータベースの管理用キーは、サーバー側の環境変数としてのみ保持し、ブラウザには一切配布していません。",
    ],
  },
];

export default function SecurityPage() {
  return (
    <LegalPageLayout
      badge="🛡️ セキュリティ"
      title="セキュリティへの取り組み"
      lead="お金と個人情報をお預かりするサービスとして、CaramYell が実際に行っている対策をご説明します。"
      updatedAt={UPDATED_AT}
      width="wide"
    >
      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        {PILLARS.map((pillar) => (
          <PillarCard key={pillar.title} pillar={pillar} />
        ))}
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
          安全にご利用いただくために
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Callout icon="🔑" title="パスワードと二段階認証">
            <ul className="list-disc pl-5 space-y-1.5 marker:text-caramel-400">
              <li>他のサービスと同じパスワードは使わないでください。</li>
              <li>推測されにくい、十分な長さのパスワードを設定してください。</li>
              <li>認証アプリによる二段階認証の設定をおすすめします。</li>
              <li>共用の端末では、ご利用後にログアウトしてください。</li>
            </ul>
          </Callout>
          <Callout icon="🎣" title="なりすましメールにご注意ください">
            <p>
              {"当社から、クレジットカード番号やパスワードをメールや電話でお尋ねすることはありません。"}
            </p>
            <p>
              {`メール内のリンクを開く前に、送信元と、リンク先が ${SITE_DOMAIN} のドメインであることをご確認ください。`}
            </p>
            <p>
              {"不審なご連絡を受け取られた場合は、リンクを開かずにお問い合わせ窓口までお知らせください。"}
            </p>
          </Callout>
        </div>
      </section>

      <section className="rounded-3xl bg-white shadow-soft p-6 sm:p-8">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          脆弱性を発見された方へ
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-5">
          {"サービスの安全性向上のため、セキュリティ上の問題のご報告を歓迎しています。発見された場合は、公開する前に当社までご連絡いただけますと幸いです。"}
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">報告の方法</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {"お問い合わせフォームの種別で「脆弱性の報告」を選ぶか、下記アドレス宛にメールでご連絡ください。再現手順と影響範囲を添えていただけると助かります。"}
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-block mt-2 text-sm font-bold text-caramel-600 hover:underline break-all"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">
              調査にあたってのお願い
            </h3>
            <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-5 space-y-1.5 marker:text-caramel-400">
              <li>ご自身の管理下にないアカウントやデータにはアクセスしないでください。</li>
              <li>
                サービスの停止や性能低下を招く試験（大量のリクエストの送信など）はご遠慮ください。
              </li>
              <li>取得された情報は、報告後にすみやかに削除してください。</li>
              <li>対応が完了するまで、内容の公表はお控えください。</li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed mt-6 pt-5 border-t border-caramel-100">
          {"現時点では、報奨金をお支払いする制度は設けておりません。いただいたご報告には、内容を確認のうえ順次ご返信します。"}
        </p>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <FooterLink
          href="/privacy"
          emoji="🔐"
          title="プライバシーポリシー"
          note="取得する情報と、その渡し先"
        />
        <FooterLink
          href="/contact"
          emoji="📮"
          title="お問い合わせ"
          note="ご不明な点はこちらから"
        />
      </div>
    </LegalPageLayout>
  );
}

function PillarCard({ pillar }: { pillar: Pillar }) {
  return (
    <section
      className="rounded-3xl bg-white p-6 border-2"
      style={{ borderColor: `${pillar.color}25` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${pillar.color}20` }}
        >
          {pillar.emoji}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-800">{pillar.title}</h2>
          <p className="text-xs text-gray-400">{pillar.lead}</p>
        </div>
      </div>
      <ul className="text-sm text-gray-600 leading-relaxed space-y-2">
        {pillar.points.map((point, i) => (
          <li key={i} className="flex gap-2">
            <span
              className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
              style={{ background: pillar.color }}
            />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FooterLink({
  href,
  emoji,
  title,
  note,
}: {
  href: string;
  emoji: string;
  title: string;
  note: string;
}): ReactNode {
  return (
    <Link
      href={href}
      className="block rounded-3xl bg-white border-2 border-caramel-100 p-5 hover:border-caramel-300 hover:shadow-soft transition-all"
    >
      <span className="text-2xl">{emoji}</span>
      <p className="text-sm font-bold text-gray-800 mt-2">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{note}</p>
    </Link>
  );
}
