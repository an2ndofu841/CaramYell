-- 掲載者（クリエイター）のプロフィール編集機能まわり。
--   1. アイコン画像用のストレージバケット
--   2. 自己更新で role を書き換えられないようにする保護

-- ============================================
-- 1. アバター画像用バケット（公開読み取り）
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 2097152,
      allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

-- アップロード/削除は API ルート（service role）経由で行うため、
-- ここでは一般ユーザー向けの書き込みポリシーは作らない。

-- ============================================
-- 2. role の自己昇格を防ぐ
-- ============================================
-- profiles は「本人が自分の行を UPDATE できる」ポリシーになっており、
-- 対象カラムを絞れないため、匿名キーを使って role = 'admin' に書き換えられてしまう。
-- プロフィール編集を開放するのに合わせ、一般ユーザーの更新では role を据え置く。
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  -- service role / DB内部処理（auth.uid() が無い）と運営管理者はそのまま通す
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();
