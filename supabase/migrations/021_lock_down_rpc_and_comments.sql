-- 020 の続き。Supabase のデータベースリンターが拾った残りを潰す。
--
-- 1) comments は誰でも任意の user_id で書き込めた
-- 2) 内部用の関数が anon / authenticated から RPC で呼べていた
-- 3) SECURITY DEFINER なのに search_path が固定されていない関数がある

-- ============================================
-- 1) コメント
-- ============================================
-- 機能自体はまだ画面に出ていない（タブは固定文言）が、テーブルは
-- WITH CHECK (true) で開いており、他人の user_id を名乗る行を仕込める。
-- 実装した瞬間に表示されてしまうので、先に本来の条件にしておく。

DROP POLICY IF EXISTS "Anyone can create comments" ON public.comments;
CREATE POLICY "Signed-in users comment as themselves" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND project_id IN (
      SELECT id FROM public.projects
      WHERE status IN ('active', 'funded', 'completed')
        AND allow_comments
    )
  );

-- 下書きプロジェクトのコメントまで読めていた
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments of visible projects are viewable" ON public.comments
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE status IN ('active', 'funded', 'completed')
         OR creator_id = auth.uid()
    )
  );

-- ============================================
-- 2) 内部用関数を PostgREST から隠す
-- ============================================
-- public スキーマの関数は既定で anon / authenticated に EXECUTE が付き、
-- /rest/v1/rpc/<name> として外から呼べてしまう。020 で PUBLIC からは
-- 剥がしたが、この2ロールへの明示的な付与が残っていた。
--
-- トリガー関数の EXECUTE 権限は CREATE TRIGGER の時点で確認され、
-- 発火時には見られないため、剥がしてもトリガーは動き続ける。

REVOKE EXECUTE ON FUNCTION public.recalc_reward_claimed(UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_reward_claimed_from_items() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_reward_claimed_from_backer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_project_writes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_backer_writes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_project_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 020 で backer_items 起点の方式に置き換えたので、もう誰も呼ばない
DROP FUNCTION IF EXISTS public.update_reward_claimed();

-- is_admin / is_creator / is_privileged_writer は RLS ポリシーと
-- SECURITY INVOKER のガードトリガーから呼ばれるため EXECUTE を残す。
-- 返るのは「その UUID が管理者か」だけで、profiles.role はもともと公開されている。

-- ============================================
-- 3) search_path の固定
-- ============================================
-- search_path が可変だと、呼び出し側が用意した同名オブジェクトを
-- 掴まされる余地が残る。handle_new_user は SECURITY DEFINER なので特に。
-- 本体には触れず設定だけ足す。

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_project_stats() SET search_path = public;
