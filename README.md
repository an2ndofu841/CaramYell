# 🍬 CaramYell - みんなで夢を叶えるクラウドファンディング

> ロリポップな可愛いデザインで、世界一やさしいクラウドファンディングサービス

## ✨ 特徴

- 💸 **掲載者の手数料 完全0円** - 出資者に8%を上乗せする仕組み（率は `src/lib/config/fees.ts` に集約）
- ⚡ **最短30分で掲載開始** - シンプルな審査フロー
- 🎁 **アカウント不要で出資** - メールアドレスのみでOK（デジタルリターンは住所も不要）
- 🤖 **AIがプロジェクト作りをサポート** - 説明文・タグラインをAI生成
- 📱 **デジタルリターン対応** - 限定ボイス・デジタルチェキ・限定動画URLなど
- 🌍 **多様な決済手段** - クレジットカード / Apple Pay / Google Pay / Link
- 🔤 **AI自動翻訳** - OpenAIによる多言語対応

## 🛠️ 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 15 (App Router) |
| スタイリング | Tailwind CSS + Framer Motion |
| バックエンド | Supabase (PostgreSQL + Auth + Storage) |
| 決済 | Stripe Checkout (カード / Apple Pay / Google Pay / Link) |
| AI | OpenAI API (GPT-4o-mini) |
| デプロイ | Vercel |

## 🚀 セットアップ

### 1. 環境変数の設定

`.env.local` を編集して各サービスのAPIキーを設定:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe（決済は Stripe Checkout へのリダイレクト方式なので公開キーは使いません）
STRIPE_SECRET_KEY=your_stripe_sk
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App（ローカル開発時。本番/Vercelでは https://caramyell.com を設定）
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> 本番ドメインは `caramyell.com`（`src/lib/config/site.ts` で定義）。
> `NEXT_PUBLIC_APP_URL` はローカル開発でのみ参照され、本番ビルドでは常に本番ドメインが使われます。
> 独自プレビュー環境などで上書きしたい場合のみ `NEXT_PUBLIC_SITE_URL` を設定してください。

### 2. Supabaseのセットアップ

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. `supabase/migrations/` 配下のSQLを番号順にSupabaseのSQLエディタで実行
   （`011_profile_editing.sql` はプロフィール編集で使うアイコン用バケットと
   role の自己昇格防止を含むため、既存プロジェクトでも適用が必要）
3. Authentication設定でGoogle/GitHubプロバイダーを有効化
4. Authentication → URL Configuration で以下を設定
   - Site URL: `https://caramyell.com`
   - Redirect URLs: `https://caramyell.com/auth/callback`（ローカル用に `http://localhost:3000/auth/callback` も追加）

### 3. Stripeのセットアップ

テスト用と本番用の違いは API キーの接頭辞（`sk_test_` / `sk_live_`）だけで、
コード側にモードの分岐はありません。同じ手順をテストモードと本番モードの
それぞれで行い、環境ごとに対応するキーを設定します。

1. [Stripe](https://stripe.com) でアカウント作成
2. Apple Pay / Google Pay のドメイン登録に `caramyell.com` を追加
3. Webhookエンドポイントを `https://caramyell.com/api/stripe/webhook` に設定し、
   以下のイベントを選択
   - `checkout.session.completed`（決済完了）
   - `checkout.session.async_payment_succeeded`（コンビニ払いなど後から入金される決済）
   - `payment_intent.payment_failed`（決済失敗）
   - `charge.refunded`（返金。これが無いと返金してもプロジェクトの集計金額が減らない）
4. 作成したエンドポイントの署名シークレット（`whsec_...`）を `STRIPE_WEBHOOK_SECRET` に設定

#### 決済手段を増やすとき

`create-checkout` は `payment_method_types` を指定していないため、
[ダッシュボードの決済手段設定](https://dashboard.stripe.com/settings/payment_methods)で
有効にしたものがそのままチェックアウト画面に並びます。決済を通すだけならコードの
変更は不要です。

ただし支援画面・プロジェクト詳細・特商法ページ・FAQ に出る「使える決済手段」の
文言は `src/lib/config/payment-methods.ts` の `enabled` から生成しています。
**ダッシュボードで切り替えたら、必ずこのファイルも合わせて更新してください。**
片方だけ変えると、案内にない手段が決済画面に出たり、その逆が起きます。

Apple Pay / Google Pay / Link はカードの上に乗るウォレットなので、`card` が
有効なら自動的に候補に入ります（対応ブラウザかつ端末に登録済みの場合のみ表示）。
Checkout は Stripe のドメインで動くため、ドメイン登録は不要です。

PayPay は日本の Stripe アカウントで、チェックアウトが payment モード・JPY
であれば使えます（このアプリはどちらも満たしています）。¥50〜1,000,000 の範囲で
表示され、支払いは即時確定、チャージバックはありません。現在はダッシュボードで
無効にしてあるため、案内も出していません。

コンビニ決済は後払いなので、有効にする前に別途対応が要ります。申込時点では
入金されず、支援者は成功ページに戻らずに Stripe の支払い案内ページへ飛びます。
支払期限の設定、案内メール、期限切れ（`checkout.session.async_payment_failed`）の
処理が未実装です。また Stripe 側の業種制限で、開業3年未満の個人事業主は使えません。
対応が済むまではダッシュボードで無効のままにしてください。

#### 本番決済に切り替えるとき

本番モードの Webhook は署名シークレットが別物になるため、キーとセットで差し替えます。

1. Stripe アカウントの本番利用申請（事業者情報・銀行口座・本人確認）を完了させる
2. 本番モードで上記 3〜4 をやり直す
3. Vercel の Production 環境変数を live の値に更新
   - `STRIPE_SECRET_KEY` → `sk_live_...`（権限を絞った `rk_live_...` でも可）
   - `STRIPE_WEBHOOK_SECRET` → 本番 Webhook の `whsec_...`
4. 本番モードで決済手段（カード / Apple Pay / Google Pay / Link など）を有効化
5. 再デプロイして、実カードで最小額の支援を1件通し、返金まで確認する

Production 環境にテストキーが残っていると `/api/stripe/create-checkout` が
503 を返して決済を止めます（`src/lib/stripe/mode.ts`）。支援者に決済が
通ったように見えて入金が無い、という事態を防ぐためのガードです。

### 4. 開発サーバー起動

```bash
npm install
npm run dev
```

http://localhost:3000 でアクセス

### 5. ドメイン設定（本番）

本番ドメインは `caramyell.com`。コード側の参照は `src/lib/config/site.ts` に集約しているため、
ドメインを変える場合はこのファイルと以下の外部設定を更新します。

- Vercel: Project → Settings → Domains に `caramyell.com` と `www.caramyell.com` を追加
- Vercel: 環境変数 `NEXT_PUBLIC_APP_URL` を `https://caramyell.com` に設定
- Supabase: Site URL / Redirect URLs（上記2-4）
- Stripe: Webhook URL と Apple Pay ドメイン登録（上記3）
- Google / GitHub OAuth: 各コンソールのコールバックURLを Supabase の callback に合わせて更新

## 📁 ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # ランディングページ
│   ├── projects/           # プロジェクト関連ページ
│   │   ├── page.tsx        # 一覧
│   │   ├── [id]/           # 詳細
│   │   └── create/         # 作成フロー
│   ├── back/[projectId]/   # 出資フロー
│   ├── dashboard/          # クリエイターダッシュボード
│   ├── auth/               # 認証ページ
│   └── api/                # APIルート
│       ├── ai/generate/    # AI生成API
│       ├── projects/       # プロジェクトCRUD
│       └── stripe/         # Stripe決済API
├── components/
│   ├── animations/         # アニメーションコンポーネント
│   ├── home/               # ホームページセクション
│   ├── layout/             # ヘッダー・フッター
│   ├── project/            # プロジェクト関連コンポーネント
│   └── ui/                 # 汎用UIコンポーネント
├── lib/
│   ├── supabase/           # Supabaseクライアント
│   └── utils.ts            # ユーティリティ関数
└── types/                  # TypeScript型定義
```

## 🗄️ データベース設計

主要テーブル:
- `profiles` - ユーザープロフィール（Supabase Auth連携）
- `projects` - プロジェクト情報
- `rewards` - リターン設定
- `backers` - 出資者情報（ゲスト対応）
- `project_updates` - 活動報告
- `comments` - コメント
- `digital_reward_contents` - デジタルリターンコンテンツ

## 🌐 Vercelデプロイ

```bash
# Vercel CLIでデプロイ
npm i -g vercel
vercel

# または GitHub連携で自動デプロイ
```

Vercelの環境変数に `.env.local` の内容を設定してください。

## 📱 主要ページ

| ページ | URL | 説明 |
|--------|-----|------|
| ランディング | `/` | トップページ・特徴紹介 |
| プロジェクト一覧 | `/projects` | 検索・フィルター付き一覧 |
| プロジェクト詳細 | `/projects/[slug]` | 詳細・リターン選択・応援 |
| プロジェクト作成 | `/projects/create` | AIアシスト付き作成フロー |
| 出資フロー | `/back/[slug]` | ゲスト対応・多決済方法 |
| ダッシュボード | `/dashboard` | クリエイター管理画面 |
| ログイン | `/auth/login` | ソーシャルログイン対応 |

---

Made with 💕 by CaramYell Team
