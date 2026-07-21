-- プロジェクト作成を管理者（弊社アカウント）のみに制限するための role 追加
-- アカウント登録自体は誰でも可能（デフォルト 'user'）だが、
-- プロジェクト作成は role = 'admin' のユーザーのみに許可する。

-- ============================================
-- profiles に role カラムを追加
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- ============================================
-- 管理者判定用ヘルパー関数
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- プロジェクト作成の RLS を管理者のみに更新
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;

CREATE POLICY "Only admins can create projects" ON public.projects
  FOR INSERT
  WITH CHECK (
    creator_id = auth.uid()
    AND public.is_admin(auth.uid())
  );

-- ============================================
-- 管理者アカウントの設定方法（手動）
-- ============================================
-- 弊社アカウントを管理者にするには、対象ユーザーの登録後に以下を実行:
--   UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';
-- もしくはメールアドレスから:
--   UPDATE public.profiles SET role = 'admin'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'you@example.com');
