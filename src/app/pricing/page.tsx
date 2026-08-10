import Link from "next/link";
import type { Metadata } from "next";
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
      badge="💰 手数料について"
      title="手数料の仕組み"
      lead="掲載者の手数料は0%。集まった支援金は全額お渡しします。かわりに、応援する側にサービス手数料をご負担いただいています。"
      width="wide"
    >
      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        <div
          className="rounded-3xl p-7 border-2 text-center"
          style={{
            borderColor: "rgba(143, 212, 196, 0.35)",
            background: "rgba(143, 212, 196, 0.08)",
          }}
        >
          <p className="text-sm font-bold text-gray-600 mb-1">
            プロジェクトを掲載する方
          </p>
          <p
            className="text-5xl font-black mb-2"
            style={{ color: "#5CB5A1", fontFamily: "var(--font-display)" }}
          >
            0<span className="text-3xl">%</span>
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {"掲載も、支援金の受け取りも無料です。決済にかかる費用も差し引きません。"}
          </p>
        </div>

        <div
          className="rounded-3xl p-7 border-2 text-center"
          style={{
            borderColor: "rgba(242, 128, 123, 0.35)",
            background: "rgba(242, 128, 123, 0.08)",
          }}
        >
          <p className="text-sm font-bold text-gray-600 mb-1">応援する方</p>
          <p
            className="text-5xl font-black mb-2"
            style={{ color: "#F2807B", fontFamily: "var(--font-display)" }}
          >
            {BACKER_FEE_PERCENT}
            <span className="text-3xl">%</span>
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {`支援額に上乗せしてお支払いいただきます。${HERO_EXAMPLE.baseText}円のリターンなら、お支払いは${HERO_EXAMPLE.totalText}円です。`}
          </p>
        </div>
      </div>

      <section className="rounded-3xl bg-white shadow-soft p-6 sm:p-8 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">金額ごとの計算例</h2>
        <p className="text-sm text-gray-500 mb-5">
          {`サービス手数料は支援額の${BACKER_FEE_PERCENT}%（1円未満は四捨五入）です。`}
        </p>

        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-sm border-collapse min-w-[26rem]">
            <thead>
              <tr className="border-b-2 border-caramel-100">
                <th className="text-left font-bold text-gray-700 py-2.5 pr-3">
                  支援額
                </th>
                <th className="text-right font-bold text-gray-700 py-2.5 px-3">
                  サービス手数料
                </th>
                <th className="text-right font-bold text-gray-700 py-2.5 px-3">
                  お支払い総額
                </th>
                <th className="text-right font-bold text-gray-700 py-2.5 pl-3">
                  掲載者の受取額
                </th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLES.map((e) => (
                <tr key={e.base} className="border-b border-caramel-100 last:border-b-0">
                  <td className="py-3 pr-3 text-gray-700 font-semibold">
                    ¥{e.baseText}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-500">
                    ¥{e.feeText}
                  </td>
                  <td
                    className="py-3 px-3 text-right font-bold"
                    style={{ color: "#F2807B" }}
                  >
                    ¥{e.totalText}
                  </td>
                  <td
                    className="py-3 pl-3 text-right font-bold"
                    style={{ color: "#5CB5A1" }}
                  >
                    ¥{e.baseText}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          {"実際にお支払いいただく金額は、支援手続きの確認画面と決済画面に表示されます。"}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <Callout icon="💡" title="なぜ掲載者から手数料をいただかないのか">
          <p>
            {"クラウドファンディングでは、集まった金額から1〜2割が手数料として差し引かれるのが一般的です。そのぶん、実際にやりたかったことを削らざるを得ない場面があります。"}
          </p>
          <p>
            {"CaramYell では手数料を応援する側にご負担いただくことで、掲載者が計画したとおりの金額を受け取れるようにしています。"}
          </p>
        </Callout>

        <Callout icon="🧾" title="サービス手数料に含まれるもの">
          <p>
            {`${BACKER_FEE_PERCENT}%のサービス手数料には、決済にかかる費用、プラットフォームの運営・保守にかかる費用が含まれます。`}
          </p>
          <p>
            {"支援額とは別に、当社から追加の費用を請求することはありません。配送を伴うリターンの送料の扱いは、各リターンの説明に記載しています。"}
          </p>
        </Callout>
      </div>

      <section className="rounded-3xl bg-white shadow-soft p-6 sm:p-8 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">よくあるご質問</h2>
        <dl className="space-y-4 text-sm">
          <FeeQa q="最低いくらから応援できますか？">
            {"100円から応援できます。リターンを選ばずに、好きな金額で応援することもできます。"}
          </FeeQa>
          <FeeQa q="いつ課金されますか？">
            {"支援のお申し込み時に、その場で決済されます。目標金額に届いたかどうかにかかわらず決済が行われ、目標未達を理由とした返金はありません。"}
          </FeeQa>
          <FeeQa q="どんな支払い方法が使えますか？">
            {`${paymentMethodList("ja")}に対応しています。決済は Stripe を通じて行われ、カード情報は当社のサーバーに保存されません。`}
          </FeeQa>
          <FeeQa q="集まった支援金はいつ受け取れますか？">
            {"募集期間の終了後、当社から掲載者へ個別にご連絡のうえ、お渡しの手続きを行います。お渡しに必要な情報も、そのときに確認します。"}
          </FeeQa>
          <FeeQa q="海外発行のカードでも手数料は同じですか？">
            {`サービス手数料は同じ${BACKER_FEE_PERCENT}%です。決済は日本円で行われるため、カード会社所定の為替手数料が別途かかることがあります。`}
          </FeeQa>
        </dl>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink href="/faq" emoji="❓" title="よくある質問" note="支援・掲載の疑問はこちら" />
        <QuickLink href="/guide" emoji="📚" title="ガイド" note="応援と掲載の流れ" />
        <QuickLink
          href="/commercial"
          emoji="📋"
          title="特定商取引法に基づく表記"
          note="取引条件の詳細"
        />
      </div>
    </LegalPageLayout>
  );
}

function FeeQa({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-caramel-100 pb-4 last:border-b-0 last:pb-0">
      <dt className="font-bold text-gray-800 mb-1.5">{q}</dt>
      <dd className="text-gray-600 leading-relaxed">{children}</dd>
    </div>
  );
}

function QuickLink({
  href,
  emoji,
  title,
  note,
}: {
  href: string;
  emoji: string;
  title: string;
  note: string;
}) {
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
