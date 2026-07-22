-- 途中保存（下書き）と関係者プレビューリンクのための preview_token。
-- トークンを知っている人だけが、未公開（draft/reviewing 等）のプロジェクトを
-- 実際の掲載画面と同じ見た目でプレビューできる。

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS preview_token TEXT NOT NULL DEFAULT gen_random_uuid()::text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_preview_token
  ON public.projects(preview_token);

-- トークンで1件取得（RLSをバイパス。トークン自体がアクセス権）。
-- 詳細ページが期待する形（profiles/categories/rewards/project_milestones をネスト）で返す。
CREATE OR REPLACE FUNCTION public.get_project_by_preview_token(p_token text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_jsonb(p) || jsonb_build_object(
    'profiles', (SELECT to_jsonb(pr) FROM public.profiles pr WHERE pr.id = p.creator_id),
    'categories', (SELECT to_jsonb(c) FROM public.categories c WHERE c.id = p.category_id),
    'rewards', (
      SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.sort_order), '[]'::jsonb)
      FROM public.rewards r WHERE r.project_id = p.id
    ),
    'project_milestones', (
      SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.sort_order), '[]'::jsonb)
      FROM public.project_milestones m WHERE m.project_id = p.id
    )
  )
  FROM public.projects p
  WHERE p.preview_token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_by_preview_token(text) TO anon, authenticated;
