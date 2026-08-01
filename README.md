# 🍬 CaramYell - みんなで夢を叶えるクラウドファンディング

> ロリポップな可愛いデザインで、世界一やさしいクラウドファンディングサービス

## ✨ 特徴

- 💸 **掲載者の手数料 完全0円** - 出資者に10%を上乗せする仕組み
- ⚡ **最短30分で掲載開始** - シンプルな審査フロー
- 🎁 **アカウント不要で出資** - メールアドレスのみでOK（デジタルリターンは住所も不要）
- 🤖 **AIがプロジェクト作りをサポート** - 説明文・タグラインをAI生成
- 📱 **デジタルリターン対応** - 限定ボイス・デジタルチェキ・限定動画URLなど
- 🌍 **海外決済対応** - Apple Pay / Google Pay / PayPal / クレジットカード
- 🔤 **AI自動翻訳** - OpenAIによる多言語対応

## 🛠️ 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 15 (App Router) |
| スタイリング | Tailwind CSS + Framer Motion |
| バックエンド | Supabase (PostgreSQL + Auth + Storage) |
| 決済 | Stripe (Apple Pay / Google Pay / PayPal) |
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

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pk
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
2. `supabase/migrations/001_initial_schema.sql` をSupabaseのSQLエディタで実行
3. Authentication設定でGoogle/GitHubプロバイダーを有効化
4. Authentication → URL Configuration で以下を設定
   - Site URL: `https://caramyell.com`
   - Redirect URLs: `https://caramyell.com/auth/callback`（ローカル用に `http://localhost:3000/auth/callback` も追加）

### 3. Stripeのセットアップ

1. [Stripe](https://stripe.com) でアカウント作成
2. Apple Pay / Google Pay のドメイン登録に `caramyell.com` を追加
3. Webhookエンドポイントを `https://caramyell.com/api/stripe/webhook` に設定
   - `checkout.session.completed` イベントを選択
   - `payment_intent.payment_failed` イベントを選択

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
