-- プレビューでも活動報告が見えるようにする。
-- 掲載者が公開前に見た目を確認する用途なので、支援者限定の投稿も含める
-- （この関数は秘密のプレビュートークンを知っている人しか呼べない）。

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
    ),
    'project_updates', (
      SELECT coalesce(jsonb_agg(to_jsonb(u) ORDER BY u.created_at DESC), '[]'::jsonb)
      FROM public.project_updates u WHERE u.project_id = p.id
    )
  )
  FROM public.projects p
  WHERE p.preview_token = p_token
  LIMIT 1;
$$;
