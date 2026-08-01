-- 掲載者ロールを追加する
--
-- これまでプロジェクトを作れるのは admin だけだった。運営が個別に掲載者を
-- 承認できるよう creator を挟み、「サイトの管理権限」と「掲載する権限」を分ける。

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'creator', 'admin'));

CREATE OR REPLACE FUNCTION public.is_creator(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role IN ('creator', 'admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.is_creator(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_creator(UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS "Only admins can create projects" ON public.projects;
CREATE POLICY "Creators can create projects" ON public.projects
  FOR INSERT
  WITH CHECK (
    creator_id = auth.uid()
    AND public.is_creator(auth.uid())
  );
