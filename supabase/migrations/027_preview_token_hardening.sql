-- プレビュートークンまわりの締め直し。
--
-- 公開APIと公開ページが projects を select('*') で引いていたため、
-- preview_token が誰にでも見える状態だった。トークンさえ拾えば
-- get_project_by_preview_token を直接呼べて、RLS を迂回して
-- 支援者限定の活動報告まで読めてしまう。
--
-- アプリ側は公開レスポンスから preview_token を外した（public-columns.ts）。
-- ここでは DB 側でも、
--   1. プレビューでは支援者限定の活動報告を返さない
--   2. 掲載者プロフィールは表示に要る列だけ返す（role などを渡さない）
--   3. すでに外に出てしまったトークンを配り直す
-- の3点を行う。

CREATE OR REPLACE FUNCTION public.get_project_by_preview_token(p_token text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_jsonb(p) || jsonb_build_object(
    'profiles', (
      SELECT jsonb_build_object(
        'id', pr.id,
        'username', pr.username,
        'display_name', pr.display_name,
        'avatar_url', pr.avatar_url,
        'bio', pr.bio,
        'website_url', pr.website_url,
        'twitter_handle', pr.twitter_handle
      )
      FROM public.profiles pr WHERE pr.id = p.creator_id
    ),
    'categories', (SELECT to_jsonb(c) FROM public.categories c WHERE c.id = p.category_id),
    'rewards', (
      SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.sort_order), '[]'::jsonb)
      FROM public.rewards r WHERE r.project_id = p.id
    ),
    'project_milestones', (
      SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.sort_order), '[]'::jsonb)
      FROM public.project_milestones m WHERE m.project_id = p.id
    ),
    -- 支援者限定の投稿は返さない。プレビューは見た目の確認が目的で、
    -- 中身は掲載者ならダッシュボードで読める。こうしておけば
    -- 万一トークンが漏れても、支援者だけの内容までは渡らない。
    'project_updates', (
      SELECT coalesce(jsonb_agg(to_jsonb(u) ORDER BY u.created_at DESC), '[]'::jsonb)
      FROM public.project_updates u
      WHERE u.project_id = p.id AND u.is_backers_only IS NOT TRUE
    )
  )
  FROM public.projects p
  WHERE p.preview_token = p_token
  LIMIT 1;
$$;

-- 公開中のプロジェクトのトークンは一覧APIと詳細ページから配られてしまって
-- いたので、すべて発行し直す。掲載前に配ったプレビューリンクは無効になるが、
-- 掲載者はダッシュボードから新しいリンクを取り直せる。
UPDATE public.projects
SET preview_token = gen_random_uuid()::text
WHERE status IN ('active', 'funded', 'completed');
