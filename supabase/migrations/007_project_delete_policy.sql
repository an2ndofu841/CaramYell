-- 作成者が自分のプロジェクトを削除できるようにする RLS。
-- 子テーブル（rewards / backers / project_milestones / project_updates /
-- comments / favorites）は projects への ON DELETE CASCADE のため連鎖削除される。

CREATE POLICY "Creators can delete own projects" ON public.projects
  FOR DELETE USING (creator_id = auth.uid());
