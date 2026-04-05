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

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabaseのセットアップ

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. `supabase/migrations/001_initial_schema.sql` をSupabaseのSQLエディタで実行
3. Authentication設定でGoogle/GitHubプロバイダーを有効化

### 3. Stripeのセットアップ

1. [Stripe](https://stripe.com) でアカウント作成
2. Apple Pay / Google Pay のドメイン設定
3. Webhookエンドポイントを `/api/stripe/webhook` に設定
   - `checkout.session.completed` イベントを選択
   - `payment_intent.payment_failed` イベントを選択

### 4. 開発サーバー起動

```bash
npm install
npm run dev
```

http://localhost:3000 でアクセス

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
