import type { Metadata } from "next";
import type { ReactNode } from "react";
import LegalPageLayout, { Callout } from "@/components/layout/LegalPageLayout";
import { BACKER_FEE_PERCENT } from "@/lib/config/fees";
import { paymentMethodList } from "@/lib/config/payment-methods";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description:
    "CaramYell を運営する株式会社めしあがレーベルの事業者情報と、支援（購入）にあたっての取引条件を掲載しています。",
};

/** 最後に内容を見直した日。事業者情報を変えたらここも更新する */
const UPDATED_AT = "2026年8月11日";

/**
 * 法定表記の1項目。項目名と内容を並べるだけだが、スマホでは縦積み、
 * 画面が広いときは左に項目名を寄せて読み比べやすくする。
 */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-5 sm:grid-cols-[13rem_1fr] sm:gap-6 border-b border-line last:border-b-0">
      <dt className="text-sm font-bold text-ink sm:pt-0.5">{label}</dt>
      <dd className="text-sm text-ink-soft leading-relaxed space-y-2">
        {children}
      </dd>
    </div>
  );
}

export default function CommercialPage() {
  return (
    <LegalPageLayout
      eyebrow="Legal notice"
      title="特定商取引法に基づく表記"
      lead="特定商取引法第11条に基づき、CaramYell の運営事業者と取引条件について表示しています。"
      updatedAt={UPDATED_AT}
    >
        <div className="bg-white rounded-xl border border-line px-6 sm:px-8 py-2">
          <dl>
            <Row label="事業者名">株式会社めしあがレーベル</Row>

            <Row label="運営責任者">
              請求があった場合は遅滞なく開示します
            </Row>

            <Row label="所在地">
              <p>〒150-0044</p>
              <p>東京都渋谷区円山町5番3号 MIEUX渋谷ビル8階</p>
            </Row>

            <Row label="電話番号">
              <a
                href="tel:07085095708"
                className="font-bold text-ink underline underline-offset-2 hover:text-caramel-600 break-all"
              >
                070-8509-5708
              </a>
            </Row>

            <Row label="メールアドレス">
              <a
                href="mailto:info@mlbl.co.jp"
                className="font-bold text-ink underline underline-offset-2 hover:text-caramel-600 break-all"
              >
                info@mlbl.co.jp
              </a>
              <p className="text-xs text-ink-muted">
                お問い合わせはメールでの受付を基本としています。
              </p>
            </Row>

            <Row label="サイトURL">
              <a
                href="https://caramyell.com"
                className="font-bold text-ink underline underline-offset-2 hover:text-caramel-600 break-all"
              >
                https://caramyell.com
              </a>
            </Row>

            <Row label="販売価格">
              <p>
                {"各プロジェクトページおよび各リターンに表示された金額（消費税込）です。"}
              </p>
              <p>
                {"リターンを選ばずに、任意の金額（100円以上）で支援することもできます。"}
              </p>
            </Row>

            <Row label="商品代金以外に必要な費用">
              <p>
                {`支援額に対して${BACKER_FEE_PERCENT}%のサービス手数料が加算されます。お支払いいただく合計額は、支援手続きの確認画面に表示されます。`}
              </p>
              <p>
                {"配送を伴うリターンの送料の扱いは、各リターンの説明に記載しています。インターネット接続料金・通信料はお客様のご負担となります。"}
              </p>
            </Row>

            <Row label="お支払い方法">
              <p>{`${paymentMethodList("ja")}（決済代行：Stripe, Inc.）`}</p>
              <p className="text-xs text-ink-muted">
                {"クレジットカード番号などの決済情報は Stripe が取り扱い、当社のサーバーには保存されません。"}
              </p>
            </Row>

            <Row label="お支払い時期">
              <p>
                {"支援のお申し込み時に、選択された決済手段で即時にお支払いいただきます。"}
              </p>
            </Row>

            <Row label="リターンの引渡時期">
              <p>
                {"各リターンに記載されたお届け予定時期に、掲載者より提供します。デジタルリターンは、記載の時期に登録メールアドレス宛またはマイページを通じて提供します。"}
              </p>
              <p>
                {"やむを得ず時期が変更となる場合は、掲載者からプロジェクトページの活動報告などでお知らせします。"}
              </p>
            </Row>

            <Row label="キャンセル・返金について">
              <p>
                {"支援は各プロジェクトの実施を応援するものであり、お申し込み後のお客様のご都合によるキャンセル・返金は原則として承っておりません。"}
              </p>
              <p>
                {"プロジェクトが中止された場合、またはリターンが提供されないことが確定した場合は、当社および掲載者より個別にご連絡のうえ、返金等の対応を行います。"}
              </p>
              <p>
                {"お届けしたリターンに不良・破損があった場合は、到着後すみやかに上記メールアドレスまでご連絡ください。"}
              </p>
            </Row>

            <Row label="販売数量の制限">
              <p>
                {"リターンごとに数量の上限を設けている場合があります。上限に達したリターンは選択できません。"}
              </p>
            </Row>

            <Row label="動作環境">
              <p>
                {"デジタルリターンの閲覧・利用には、インターネット接続と、最新版の主要ブラウザ（Chrome / Safari / Edge / Firefox）が動作する環境が必要です。個別に環境の指定がある場合は、各リターンの説明に記載します。"}
              </p>
            </Row>
          </dl>
        </div>

        <div className="mt-6">
          <Callout title="リターンの提供主体について">
            <p>
              CaramYell は、掲載者（プロジェクトの実施者）と支援者をつなぐ場を提供しています。リターンの企画・制作・提供は各掲載者が行います。個別のプロジェクトやリターンに関するお問い合わせも、まずは上記の連絡先までご連絡ください。当社から掲載者へお取り次ぎします。
            </p>
          </Callout>
        </div>
    </LegalPageLayout>
  );
}
