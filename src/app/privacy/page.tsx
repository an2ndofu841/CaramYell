import Link from "next/link";
import type { Metadata } from "next";
import LegalPageLayout, {
  Article,
  Callout,
  List,
} from "@/components/layout/LegalPageLayout";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "CaramYell における個人情報の取得項目、利用目的、第三者への提供、Cookie の利用、開示等の請求方法について定めています。",
};

/** 内容を見直した日。取得項目や委託先を変えたらここも更新する */
const UPDATED_AT = "2026年8月11日";

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      badge="🔐 プライバシーポリシー"
      title="プライバシーポリシー"
      lead="CaramYell が、どのような情報を、何のために取得し、どこに渡しているかを具体的に記載しています。"
      updatedAt={UPDATED_AT}
    >
      <div className="bg-white rounded-3xl shadow-soft p-6 sm:p-8 mb-6">
        <p className="text-sm text-gray-600 leading-relaxed">
          {"株式会社めしあがレーベル（以下「当社」といいます）は、クラウドファンディングサービス「CaramYell」（以下「本サービス」といいます）の提供にあたり取得する個人情報を、個人情報の保護に関する法律その他の関係法令を遵守して適切に取り扱います。"}
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-soft p-6 sm:p-8">
        <Article no="1" title="取得する情報">
          <p className="font-bold text-gray-700">支援のお申し込み時</p>
          <List
            items={[
              <>
                <b>メールアドレス</b>
                {"（必須）：確認メールの送付、支援内容の照合、掲載者からのご連絡に使用します。"}
              </>,
              <>
                <b>ニックネーム</b>
                {"（任意）：支援者としての表示名です。"}
              </>,
              <>
                <b>応援メッセージ</b>
                {"（任意）"}
              </>,
              <>
                <b>匿名で応援するかどうかの選択</b>
              </>,
              <>
                <b>配送先情報</b>
                {"（配送を伴うリターンを選んだ場合のみ必須）：お届け先の氏名、国、郵便番号、都道府県、市区町村、番地、建物名。デジタルリターンのみの場合は取得しません。"}
              </>,
              <>
                <b>支援内容</b>
                {"：支援金額、サービス手数料、選択したリターン、決済の状態、決済手段の種別。"}
              </>,
            ]}
          />

          <p className="font-bold text-gray-700 pt-2">アカウント登録時・プロフィール設定時</p>
          <List
            items={[
              "メールアドレス、パスワード",
              "表示名、ユーザーID、自己紹介、Webサイト、X（旧Twitter）のアカウント名、プロフィール画像（いずれも任意項目を含みます）",
            ]}
          />
          <p className="text-xs text-gray-400">
            {"パスワードは、認証基盤である Supabase において暗号化（ハッシュ化）して保管され、当社が元のパスワードを知ることはできません。"}
          </p>

          <p className="font-bold text-gray-700 pt-2">プロジェクトの掲載時</p>
          <List
            items={[
              "プロジェクトの内容（タイトル、説明、ストーリー、目標金額、募集期間、リターンの内容、画像など）",
              "支援金をお渡しするために必要な情報。これはプロジェクト終了後に当社から個別にご連絡のうえ確認するもので、本サービスの画面上では取得していません。",
            ]}
          />

          <p className="font-bold text-gray-700 pt-2">自動的に取得する情報</p>
          <List
            items={[
              "アクセスに伴う技術的な情報（IPアドレス、ブラウザの種類、アクセス日時など）",
              "認証状態を保持するための Cookie",
              "表示言語の設定（お使いのブラウザ内にのみ保存されます）",
            ]}
          />
          <p className="text-xs text-gray-400">
            {"IPアドレスは、短時間に大量のリクエストが行われていないかを判定する目的で一時的に参照するもので、データベースには保存していません。"}
          </p>
        </Article>

        <Article no="2" title="決済情報の取り扱い">
          <p>
            {"クレジットカード番号、有効期限、セキュリティコードなどの決済情報は、決済代行会社である Stripe, Inc. が管理する決済画面で直接入力していただきます。これらの情報が当社のサーバーを経由することはなく、当社が保存することもありません。"}
          </p>
          <p>
            {"当社が受け取るのは、決済が成立したという事実、金額、決済手段の種別（カード、Apple Pay など）といった情報のみです。"}
          </p>
        </Article>

        <Article no="3" title="利用目的">
          <List
            items={[
              "本サービスの提供、本人確認、認証、およびアカウントの管理",
              "支援の受付、決済処理、確認メールの送付",
              "リターンの提供および配送のために、掲載者へ必要な情報を引き渡すこと",
              "支援金の掲載者への引き渡しに関する手続き",
              "お問い合わせへの対応",
              "不正な支援、不正アクセス、規約違反の検知と対応",
              "本サービスの品質改善および新機能の検討",
              "法令に基づく対応",
            ]}
          />
        </Article>

        <Article no="4" title="掲載者への情報の提供">
          <p>
            {"リターンをお届けし、支援者と連絡を取るために、支援に関する次の情報を、支援先のプロジェクトの掲載者に提供します。"}
          </p>
          <List
            items={[
              "メールアドレス",
              "ニックネーム、応援メッセージ、匿名希望の有無",
              "支援金額および選択されたリターン",
              "配送先情報（配送を伴うリターンを選んだ場合）",
            ]}
          />
          <Callout icon="💡" title="「匿名で応援する」を選んだ場合">
            <p>
              {"匿名の設定は、プロジェクトページなどでニックネームを表示しないためのものです。リターンのお届けとご連絡のために、掲載者の管理画面では引き続きメールアドレスをご確認いただけます。掲載者に一切知られずに支援することはできませんので、あらかじめご了承ください。"}
            </p>
          </Callout>
          <p>
            {"掲載者は、提供を受けた情報をリターンの提供および必要な連絡以外の目的で利用してはならないものとしています。"}
          </p>
        </Article>

        <Article no="5" title="業務の委託と外部サービスの利用">
          <p>
            {"本サービスの提供にあたり、次の事業者を利用しています。それぞれ必要な範囲で情報が取り扱われます。"}
          </p>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-caramel-100">
                  <th className="text-left font-bold text-gray-700 py-2 pr-3">事業者</th>
                  <th className="text-left font-bold text-gray-700 py-2 pr-3">目的</th>
                  <th className="text-left font-bold text-gray-700 py-2">渡す情報</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <VendorRow
                  name="Stripe, Inc.（米国）"
                  purpose="決済処理"
                  data="メールアドレス、支援金額、リターン名、配送先情報、ニックネーム、応援メッセージ"
                />
                <VendorRow
                  name="Supabase, Inc.（米国）"
                  purpose="データベース・認証・ファイル保管"
                  data="本ポリシーに記載の各情報（データベースは日本・東京リージョンに設置しています）"
                />
                <VendorRow
                  name="Vercel Inc.（米国）"
                  purpose="Webサイトの配信"
                  data="アクセスに伴う技術的な情報"
                />
                <VendorRow
                  name="Resend, Inc.（米国）"
                  purpose="メールの送信"
                  data="メールアドレス、メール本文に含まれる支援内容"
                />
                <VendorRow
                  name="OpenAI, L.L.C.（米国）"
                  purpose="掲載者向けの文章作成支援"
                  data="掲載者がAI機能を使ったときに入力したプロジェクトの文章"
                />
                <VendorRow
                  name="株式会社アイビス（日本）"
                  purpose="郵便番号からの住所補完"
                  data="入力された郵便番号のみ（お使いのブラウザから直接送信されます）"
                />
                <VendorRow
                  name="Google LLC（米国）"
                  purpose="Webフォントの配信"
                  data="アクセスに伴う技術的な情報"
                />
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">
            {"上記のうち米国の事業者への提供は、外国にある第三者への個人データの提供にあたります。いずれも各社が公表する個人情報保護の方針および契約に基づいて取り扱われます。"}
          </p>
        </Article>

        <Article no="6" title="第三者提供">
          <p>
            {"当社は、次の場合を除き、あらかじめご本人の同意を得ることなく個人情報を第三者に提供しません。"}
          </p>
          <List
            items={[
              "第4条に定める、リターンの提供のために必要な掲載者への提供",
              "第5条に定める、業務の委託に伴う提供",
              "法令に基づく場合",
              "人の生命、身体または財産の保護のために必要で、ご本人の同意を得ることが困難な場合",
              "事業の承継に伴って提供される場合",
            ]}
          />
        </Article>

        <Article no="7" title="Cookie などの取り扱い">
          <List
            items={[
              "ログイン状態を保持するために、認証用の Cookie を使用しています。この Cookie を無効にすると、ログインが必要な機能をご利用いただけません。",
              "表示言語（日本語／英語）の選択は、お使いのブラウザ内にのみ保存され、当社のサーバーには送信されません。",
            ]}
          />
          <p>
            {"本サービスでは、アクセス解析ツールや広告配信のためのトラッキングは利用していません。行動履歴をもとにした広告配信も行っていません。"}
          </p>
        </Article>

        <Article no="8" title="送信するメール">
          <p>{"当社からは、次の場合にメールをお送りします。"}</p>
          <List
            items={[
              "支援の決済が完了したときの確認メール",
              "アカウント登録時の確認メール、パスワード再設定のご案内",
              "お問い合わせへの返信",
              "本サービスの運営上、重要なお知らせが必要な場合",
            ]}
          />
          <p className="text-xs text-gray-400">
            {"現在、営業目的のメールマガジンは配信していません。"}
          </p>
        </Article>

        <Article no="9" title="安全管理措置">
          <p>
            {"当社は、個人情報の漏えい、滅失またはき損の防止のため、通信の暗号化、アクセス権限の限定、運営アカウントへの二段階認証の必須化、データベースへのアクセス制御などの措置を講じています。"}
          </p>
          <p>
            {"具体的な取り組みは"}
            <Link href="/security" className="font-bold text-caramel-600 hover:underline">
              セキュリティ
            </Link>
            {"のページで説明しています。"}
          </p>
        </Article>

        <Article no="10" title="保有期間">
          <List
            items={[
              "支援に関する情報は、取引の記録として、法令で定められた期間および紛争対応に必要な期間を経過するまで保有します。",
              "アカウント情報は、アカウントが存在する間、保有します。",
              "掲載者が自らプロジェクトを削除した場合、そのプロジェクトに紐づくデータも削除されます。ただし、決済に関する記録は決済代行会社側に残ります。",
            ]}
          />
        </Article>

        <Article no="11" title="開示・訂正・削除等のご請求">
          <p>
            {"ご本人から、保有個人データの利用目的の通知、開示、内容の訂正・追加・削除、利用の停止・消去、第三者提供の停止をご請求いただいた場合、ご本人であることを確認したうえで、法令に従い遅滞なく対応します。"}
          </p>
          <p>
            {"プロフィールの内容はログイン後の設定画面からご自身で変更できます。メールアドレスの変更、パスワードの変更、アカウントの削除をご希望の場合は、お問い合わせ窓口までご連絡ください。"}
          </p>
          <p className="text-xs text-gray-400">
            {"なお、実施中のプロジェクトへの支援に関する情報など、リターンの提供や取引記録の保存に必要な情報は、削除をご請求いただいても対応できない場合があります。"}
          </p>
        </Article>

        <Article no="12" title="未成年の方の利用">
          <p>
            {"未成年の方が本サービスをご利用になる場合は、事前に親権者など法定代理人の同意を得たうえでご利用ください。"}
          </p>
        </Article>

        <Article no="13" title="本ポリシーの変更">
          <p>
            {"当社は、法令の変更や本サービスの内容の変更に応じて、本ポリシーを改定することがあります。重要な変更を行う場合は、本サービス上でお知らせします。"}
          </p>
        </Article>

        <Article no="14" title="お問い合わせ窓口">
          <p>{"個人情報の取り扱いに関するお問い合わせは、下記までご連絡ください。"}</p>
          <div className="rounded-2xl bg-caramel-50/60 p-4 space-y-1">
            <p className="font-bold text-gray-700">株式会社めしあがレーベル</p>
            <p>〒150-0044 東京都渋谷区円山町5番3号 MIEUX渋谷ビル8階</p>
            <p>
              <a
                href="mailto:info@mlbl.co.jp"
                className="font-bold text-caramel-600 hover:underline"
              >
                info@mlbl.co.jp
              </a>
            </p>
          </div>
        </Article>
      </div>
    </LegalPageLayout>
  );
}

function VendorRow({
  name,
  purpose,
  data,
}: {
  name: string;
  purpose: string;
  data: string;
}) {
  return (
    <tr className="border-b border-caramel-100 last:border-b-0 align-top">
      <td className="py-3 pr-3 font-semibold text-gray-700">{name}</td>
      <td className="py-3 pr-3">{purpose}</td>
      <td className="py-3">{data}</td>
    </tr>
  );
}
