-- CaramYell クラウドファンディングサービス 初期スキーマ

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS (Supabase Auth連携 + 追加プロフィール)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website_url TEXT,
  twitter_handle TEXT,
  total_backed INTEGER DEFAULT 0,
  total_created INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CATEGORIES (プロジェクトカテゴリ)
-- ============================================
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_ja TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO public.categories (slug, name_ja, name_en, icon, color, sort_order) VALUES
  ('music', '音楽', 'Music', '🎵', '#FF6B9D', 1),
  ('art', 'アート', 'Art', '🎨', '#C3B1E1', 2),
  ('game', 'ゲーム', 'Games', '🎮', '#4ECDC4', 3),
  ('tech', 'テクノロジー', 'Technology', '💻', '#74C0FC', 4),
  ('video', '動画・映像', 'Video & Film', '🎬', '#FFB347', 5),
  ('food', 'フード', 'Food', '🍽️', '#FF9A2E', 6),
  ('fashion', 'ファッション', 'Fashion', '👗', '#FF6B9D', 7),
  ('photo', '写真', 'Photography', '📸', '#4ECDC4', 8),
  ('social', '社会・コミュニティ', 'Community', '🌍', '#74C0FC', 9),
  ('other', 'その他', 'Other', '✨', '#FFE66D', 10);

-- ============================================
-- PROJECTS (プロジェクト)
-- ============================================
CREATE TYPE project_status AS ENUM (
  'draft',        -- 下書き
  'reviewing',    -- 審査中
  'active',       -- 掲載中
  'funded',       -- 達成
  'failed',       -- 未達成
  'completed',    -- 完了
  'cancelled'     -- キャンセル
);

CREATE TABLE public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- 基本情報
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  story TEXT,
  
  -- 多言語対応
  title_en TEXT,
  tagline_en TEXT,
  description_en TEXT,
  
  -- カテゴリ・タグ
  category_id UUID REFERENCES public.categories(id),
  tags TEXT[] DEFAULT '{}',
  
  -- 目標金額・期間
  goal_amount BIGINT NOT NULL,
  current_amount BIGINT DEFAULT 0,
  backer_count INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'JPY',
  
  -- ステータス
  status project_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  
  -- メディア
  main_image_url TEXT,
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  
  -- 期間
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- 審査
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- SNSシェア用
  share_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REWARDS (リターン)
-- ============================================
CREATE TYPE reward_type AS ENUM (
  'physical',   -- 物品
  'digital',    -- デジタル
  'experience', -- 体験
  'no_reward'   -- リターンなし
);

CREATE TABLE public.rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- 多言語
  title_en TEXT,
  description_en TEXT,
  
  -- 金額・数量
  amount BIGINT NOT NULL,
  quantity_total INTEGER,
  quantity_claimed INTEGER DEFAULT 0,
  
  -- タイプ
  reward_type reward_type NOT NULL DEFAULT 'physical',
  needs_address BOOLEAN DEFAULT TRUE,
  
  -- デジタルコンテンツ情報
  digital_delivery_info TEXT,
  
  -- 配送予定
  estimated_delivery_date DATE,
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BACKERS (出資者)
-- ============================================
CREATE TYPE backer_status AS ENUM (
  'pending',    -- 決済待ち
  'paid',       -- 決済済み
  'refunded',   -- 返金済み
  'cancelled'   -- キャンセル
);

CREATE TABLE public.backers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL,
  
  -- ユーザー（ゲスト or 登録ユーザー）
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- ゲスト情報
  guest_nickname TEXT,
  guest_email TEXT NOT NULL,
  guest_address JSONB,  -- {postal_code, prefecture, city, address_line1, address_line2, country}
  
  -- 金額
  amount BIGINT NOT NULL,         -- リターン金額
  fee_amount BIGINT NOT NULL,     -- 手数料(10%)
  total_amount BIGINT NOT NULL,   -- 合計支払額
  currency TEXT DEFAULT 'JPY',
  
  -- メッセージ
  message TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  
  -- 決済
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  payment_method TEXT,            -- card, apple_pay, google_pay, paypal
  
  -- ステータス
  status backer_status DEFAULT 'pending',
  
  -- デジタルリターン配信済みフラグ
  digital_delivered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UPDATES (プロジェクト更新情報)
-- ============================================
CREATE TABLE public.project_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- 多言語
  title_en TEXT,
  content_en TEXT,
  
  is_backers_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMENTS (コメント)
-- ============================================
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  guest_nickname TEXT,
  
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FAVORITES (お気に入り)
-- ============================================
CREATE TABLE public.favorites (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

-- ============================================
-- DIGITAL REWARDS (デジタルリターンコンテンツ)
-- ============================================
CREATE TABLE public.digital_reward_contents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
  
  content_type TEXT NOT NULL,  -- 'voice', 'image', 'video_url', 'file', 'text'
  content_url TEXT,
  content_text TEXT,
  filename TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_reward_contents ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects
CREATE POLICY "Active projects are viewable by everyone" ON public.projects
  FOR SELECT USING (status IN ('active', 'funded', 'completed') OR creator_id = auth.uid());
CREATE POLICY "Authenticated users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND creator_id = auth.uid());
CREATE POLICY "Creators can update own projects" ON public.projects
  FOR UPDATE USING (creator_id = auth.uid());

-- Rewards
CREATE POLICY "Rewards are viewable by everyone" ON public.rewards
  FOR SELECT USING (true);
CREATE POLICY "Creators can manage rewards" ON public.rewards
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE creator_id = auth.uid())
  );

-- Backers
CREATE POLICY "Backers can view own backing" ON public.backers
  FOR SELECT USING (user_id = auth.uid() OR guest_email = current_setting('app.guest_email', true));
CREATE POLICY "Anyone can create backing" ON public.backers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Creators can view project backers" ON public.backers
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE creator_id = auth.uid())
  );

-- Updates
CREATE POLICY "Project updates are viewable by everyone" ON public.project_updates
  FOR SELECT USING (
    NOT is_backers_only OR
    project_id IN (SELECT project_id FROM public.backers WHERE user_id = auth.uid() AND status = 'paid')
  );
CREATE POLICY "Creators can manage updates" ON public.project_updates
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE creator_id = auth.uid())
  );

-- Comments
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);
CREATE POLICY "Anyone can create comments" ON public.comments
  FOR INSERT WITH CHECK (true);

-- Categories (全員閲覧可能)
CREATE POLICY "Categories viewable by everyone" ON public.categories
  FOR SELECT USING (true);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- updated_at自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_backers_updated_at BEFORE UPDATE ON public.backers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 新規ユーザー登録時にprofileを自動作成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 出資確定時にプロジェクトの金額・人数を更新
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    UPDATE public.projects
    SET
      current_amount = current_amount + NEW.amount,
      backer_count = backer_count + 1
    WHERE id = NEW.project_id;
  END IF;
  IF OLD.status = 'paid' AND NEW.status = 'refunded' THEN
    UPDATE public.projects
    SET
      current_amount = current_amount - OLD.amount,
      backer_count = backer_count - 1
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_backer_status_change
  AFTER INSERT OR UPDATE ON public.backers
  FOR EACH ROW EXECUTE FUNCTION update_project_stats();

-- リワードの請求数更新
CREATE OR REPLACE FUNCTION update_reward_claimed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND NEW.reward_id IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    UPDATE public.rewards
    SET quantity_claimed = quantity_claimed + 1
    WHERE id = NEW.reward_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_reward_claimed
  AFTER INSERT OR UPDATE ON public.backers
  FOR EACH ROW EXECUTE FUNCTION update_reward_claimed();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_category ON public.projects(category_id);
CREATE INDEX idx_projects_creator ON public.projects(creator_id);
CREATE INDEX idx_projects_featured ON public.projects(featured);
CREATE INDEX idx_projects_end_date ON public.projects(end_date);
CREATE INDEX idx_backers_project ON public.backers(project_id);
CREATE INDEX idx_backers_user ON public.backers(user_id);
CREATE INDEX idx_backers_email ON public.backers(guest_email);
CREATE INDEX idx_backers_status ON public.backers(status);
CREATE INDEX idx_rewards_project ON public.rewards(project_id);
CREATE INDEX idx_comments_project ON public.comments(project_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_favorites_project ON public.favorites(project_id);
