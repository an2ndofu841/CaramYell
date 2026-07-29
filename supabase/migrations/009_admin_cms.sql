-- 運営CMS向け：管理者によるユーザー管理（role変更）とユーザー一覧取得。

-- 管理者は任意のプロフィールを更新できる（role の付与/剥奪のため）
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- 管理者向けユーザー一覧（auth.users の email を含む）。
-- SECURITY DEFINER で auth スキーマにアクセスしつつ、内部で管理者チェック。
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  avatar_url text,
  role text,
  total_backed integer,
  total_created integer,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT p.id, u.email::text, p.display_name, p.avatar_url, p.role,
           p.total_backed, p.total_created, p.created_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
