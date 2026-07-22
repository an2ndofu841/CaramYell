-- 管理者による審査（承認/却下）のためのポリシー。
-- 管理者は自分が作成していないプロジェクトも閲覧・更新できる必要がある。
-- 複数の SELECT/UPDATE ポリシーは OR 評価されるため、既存ポリシーに追加する形。

CREATE POLICY "Admins can view all projects" ON public.projects
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any project" ON public.projects
  FOR UPDATE USING (public.is_admin(auth.uid()));
