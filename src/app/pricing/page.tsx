import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import LegalPageLayout, { Callout } from "@/components/layout/LegalPageLayout";
import { BACKER_FEE_PERCENT, feeExample } from "@/lib/config/fees";
import { paymentMethodList } from "@/lib/config/payment-methods";

export const metadata: Metadata = {
  title: "手数料について",
  description: `CaramYell の手数料の仕組み。掲載者の手数料は0%、応援する側に${BACKER_FEE_PERCENT}%のサービス手数料をご負担いただいています。金額ごとの計算例を掲載しています。`,
};

const EXAMPLES = [1000, 3000, 5000, 10000, 30000, 50000].map(feeExample);
const HERO_EXAMPLE = feeExample(5000);

export default function PricingPage() {
  return (
    <LegalPageLayout
      eyebrow="Pricing"
      title="手数料の仕組み"
      lead="掲載者の手数料は0%です。集まった支援金から手数料を差し引くことはありません。かわりに、応援する側にサービス手数料をご負担いただいています。"
      width="wide"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line rounded-xl overflow-hidden mb-10">
        <div className="bg-white p-6 sm:p-8">
          <p className="text-sm font-bold text-ink-muted mb-2">プロジェクトを掲載する方</p>
          <p
            className="text-5xl font-bold text-ink tabular-nums mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            0<span className="text-2xl ml-0.5">%</span>
          </p>
          <p className="text-sm text-ink-soft leading-relaxed">
            掲載も、支援金の受け取りも無料です。決済にかかる費用も差し引きません。
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8">
          <p className="text-sm font-bold text-ink-muted mb-2">応援する方</p>
          <p
            className="text-5xl font-bold text-caramel-700 tabular-nums mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {BACKER_FEE_PERCENT}
            <span className="text-2xl ml-0.5">%</span>
          </p>
          <p className="text-sm text-ink-soft leading-relaxed">
            {`支援額に上乗せしてお支払いいただきます。${HERO_EXAMPLE.baseText}円のリターンなら、お支払いは${HERO_EXAMPLE.totalText}円です。`}
          </p>
        </div>
      </div>

      <section className="rounded-xl bg-white border border-line p-6 sm:p-8 mb-6">
        <h2
          className="text-xl font-bold text-ink mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          金額ごとの計算例
        </h2>
        <p className="text-sm text-ink-muted mb-5">
          {`サービス手数料は支援額の${BACKER_FEE_PERCENT}%（1円未満は四捨五入）です。`}
        </p>

        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-sm border-collapse min-w-[26rem]">
            <thead>
              <tr className="border-b border-line-strong">
                <th className="text-left text-xs font-bold text-ink-muted py-2.5 pr-3">支援額</th>
                <th className="text-right text-xs font-bold text-ink-muted py-2.5 px-3">
                  サービス手数料
                </th>
                <th className="text-right text-xs font-bold text-ink-muted py-2.5 px-3">
                  お支払い総額
                </th>
                <th className="text-right text-xs font-bold text-ink-muted py-2.5 pl-3">
                  掲載者の受取額
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {EXAMPLES.map((e) => (
                <tr key={e.base} className="border-b border-line last:border-b-0">
                  <td className="py-3 pr-3 text-ink font-semibold">¥{e.baseText}</td>
                  <td className="py-3 px-3 text-right text-ink-muted">¥{e.feeText}</td>
                  <td className="py-3 px-3 text-right font-bold text-ink">¥{e.totalText}</td>
                  <td className="py-3 pl-3 text-right font-bold text-caramel-700">¥{e.baseText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-ink-muted mt-4">
          実際にお支払いいただく金額は、支援手続きの確認画面と決済画面に表示されます。
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <Callout title="掲載者から手数料をいただかない理由">
          <p>
            クラウドファンディングでは、集まった金額から一定の割合が手数料として差し引かれるのが一般的です。そのぶん、予定していた企画を削らざるを得ない場面があります。
          </p>
          <p>
            CaramYell では手数料を応援する側にご負担いただくことで、掲載者が計画したとおりの金額を受け取れるようにしています。
          </p>
        </Callout>

        <Callout title="サービス手数料に含まれるもの">
          <p>
            {`${BACKER_FEE_PERCENT}%のサービス手数料には、決済にかかる費用、プラットフォームの運営・保守にかかる費用が含まれます。`}
          </p>
          <p>
            支援額とは別に、当社から追加の費用を請求することはありません。配送を伴うリターンの送料の扱いは、各リターンの説明に記載しています。
          </p>
        </Callout>
      </div>

      <section className="rounded-xl bg-white border border-line p-6 sm:p-8 mb-6">
        <h2
          className="text-xl font-bold text-ink mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          よくあるご質問
        </h2>
        <dl className="divide-y divide-line text-sm">
          <FeeQa q="最低いくらから応援できますか？">
            100円から応援できます。リターンを選ばずに、好きな金額で応援することもできます。
          </FeeQa>
          <FeeQa q="いつ課金されますか？">
            支援のお申し込み時に、その場で決済されます。目標金額に届いたかどうかにかかわらず決済が行われ、目標未達を理由とした返金はありません。
          </FeeQa>
          <FeeQa q="どんな支払い方法が使えますか？">
            {`${paymentMethodList("ja")}に対応しています。決済は Stripe を通じて行われ、カード情報は当社のサーバーに保存されません。`}
          </FeeQa>
          <FeeQa q="集まった支援金はいつ受け取れますか？">
            募集期間の終了後、当社から掲載者へ個別にご連絡のうえ、お渡しの手続きを行います。お渡しに必要な情報も、そのときに確認します。
          </FeeQa>
          <FeeQa q="海外発行のカードでも手数料は同じですか？">
            {`サービス手数料は同じ${BACKER_FEE_PERCENT}%です。決済は日本円で行われるため、カード会社所定の為替手数料が別途かかることがあります。`}
          </FeeQa>
        </dl>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border border-line rounded-xl overflow-hidden">
        <QuickLink href="/faq" title="よくある質問" note="支援・掲載の疑問はこちら" />
        <QuickLink href="/guide" title="ガイド" note="応援と掲載の流れ" />
        <QuickLink href="/commercial" title="特定商取引法に基づく表記" note="取引条件の詳細" />
      </div>
    </LegalPageLayout>
  );
}

function FeeQa({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <dt className="font-bold text-ink mb-1.5">{q}</dt>
      <dd className="text-ink-soft leading-relaxed">{children}</dd>
    </div>
  );
}

function QuickLink({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 bg-white p-5 hover:bg-cream-50 transition-colors"
    >
      <span>
        <span className="block text-sm font-bold text-ink">{title}</span>
        <span className="block text-xs text-ink-muted mt-1">{note}</span>
      </span>
      <ArrowRight size={16} className="text-ink-muted group-hover:text-ink transition-colors flex-shrink-0" />
    </Link>
  );
}
