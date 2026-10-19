-- 事務所・レーベルからの掲載申請を受け付ける
--
-- これまで掲載者（creator）は運営がユーザー一覧から手で権限を付けていたが、
-- 他の事務所からの掲載を受け付けるにあたって「申し込み → 運営の確認 → 承認」の
-- 流れをサイト上で完結させる。承認すると profiles.role が creator になり、
-- 申請に書いた事務所名がプロジェクトの掲載者名として表に出る。
--
-- 既存の行には一切手を入れない（列の追加のみ・既定値は NULL）。

-- ============================================
-- 1) 掲載者の事務所名
-- ============================================
-- 公開ページに「掲載: ○○事務所」と出す名前。名乗りを本人が自由に変えられると
-- 実在の事務所をかたれてしまうので、運営（または承認処理）だけが書き換えられる。
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_name TEXT
  CHECK (organization_name IS NULL OR char_length(organization_name) BETWEEN 1 AND 100);

COMMENT ON COLUMN public.profiles.organization_name IS
  '掲載者の事務所・レーベル名。掲載申請の承認時に運営が設定する';

-- 011 の role 保護に事務所名も加える。本人の UPDATE では据え置く。
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  -- service role / DB内部処理（auth.uid() が無い）と運営管理者はそのまま通す
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.organization_name := OLD.organization_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 2) 掲載申請
-- ============================================
CREATE TABLE IF NOT EXISTS public.creator_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  organization_name TEXT NOT NULL CHECK (char_length(organization_name) BETWEEN 1 AND 100),
  organization_type TEXT NOT NULL
    CHECK (organization_type IN ('agency', 'label', 'management', 'venue', 'individual', 'other')),
  contact_name TEXT NOT NULL CHECK (char_length(contact_name) BETWEEN 1 AND 100),
  contact_email TEXT NOT NULL CHECK (char_length(contact_email) BETWEEN 3 AND 254),
  phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 30),
  website_url TEXT CHECK (website_url IS NULL OR char_length(website_url) <= 500),
  -- 所属アーティストや活動内容
  artists TEXT CHECK (artists IS NULL OR char_length(artists) <= 2000),
  -- 予定している企画の内容
  plan TEXT NOT NULL CHECK (char_length(plan) BETWEEN 1 AND 4000),
  -- 掲載を始めたい時期（自由記述）
  expected_start TEXT CHECK (expected_start IS NULL OR char_length(expected_start) <= 100),

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  -- 運営から申請者への連絡（見送りの理由など）。申請者本人にも見える
  review_note TEXT CHECK (review_note IS NULL OR char_length(review_note) <= 2000),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 審査待ちは1人1件まで。見送り後の再申請はできる
CREATE UNIQUE INDEX IF NOT EXISTS creator_applications_one_pending_per_user
  ON public.creator_applications (user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS creator_applications_status_created
  ON public.creator_applications (status, created_at DESC);

ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;

-- 本人は自分の申請だけ読める
CREATE POLICY "Applicants can view own applications" ON public.creator_applications
  FOR SELECT USING (user_id = auth.uid());

-- 本人は審査待ちの状態でしか作れない（審査結果の欄は空のまま）
CREATE POLICY "Applicants can submit applications" ON public.creator_applications
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND review_note IS NULL
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

-- 運営は全件を読めて、審査結果を書ける
CREATE POLICY "Admins can view all applications" ON public.creator_applications
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can review applications" ON public.creator_applications
  FOR UPDATE USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 申請者の更新・削除は受け付けない（内容を変えたいときは問い合わせから）

CREATE TRIGGER update_creator_applications_updated_at
  BEFORE UPDATE ON public.creator_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
