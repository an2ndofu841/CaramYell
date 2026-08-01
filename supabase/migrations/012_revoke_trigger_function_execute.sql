-- protect_profile_role() はトリガーからのみ呼ばれる SECURITY DEFINER 関数だが、
-- 既定の PUBLIC への EXECUTE 付与により /rest/v1/rpc/ 経由で誰でも呼べる状態になる。
-- 直接呼んでもエラーになるだけだが、公開APIに出す理由がないため権限を剥がす。
REVOKE ALL ON FUNCTION public.protect_profile_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_profile_role() FROM anon;
REVOKE ALL ON FUNCTION public.protect_profile_role() FROM authenticated;
