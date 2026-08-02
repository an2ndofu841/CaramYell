-- 掲載者が自分の支援者に対して後出しできてしまう部分を塞ぐ。
--
-- 020 のガードは「運営しか触れない列」を守るものだったが、支援者との約束に
-- あたる部分は素通しだった。掲載中に目標額を集まった額より下げれば未達成の
-- プロジェクトが達成済みとして表示され、締切を延ばせば示した期限を過ぎても
-- 集金が続けられる。rewards に至ってはトリガーが1つも無く、支払い済みの
-- リターンの価格を書き換えることも消すこともできた。
--
-- 運営（admin / service_role）は従来どおり通す。トラブル対応で直せないと困る。

-- ============================================
-- 1) 掲載開始後は目標額と締切を動かせない
-- ============================================

CREATE OR REPLACE FUNCTION public.guard_project_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_writer() OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.creator_id IS DISTINCT FROM OLD.creator_id THEN
    RAISE EXCEPTION '掲載者は変更できません'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.current_amount IS DISTINCT FROM OLD.current_amount
     OR NEW.backer_count IS DISTINCT FROM OLD.backer_count THEN
    RAISE EXCEPTION '支援総額と支援者数は決済処理でのみ更新されます'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.featured IS DISTINCT FROM OLD.featured THEN
    RAISE EXCEPTION '注目プロジェクトの指定は運営のみ変更できます'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION '審査結果は運営のみ更新できます'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status NOT IN ('draft', 'reviewing', 'cancelled')
       OR NEW.status NOT IN ('draft', 'reviewing') THEN
      RAISE EXCEPTION '掲載ステータスを % から % へは変更できません', OLD.status, NEW.status
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- 支援者が見て支援を決めた条件は、掲載が始まったら動かさない
  IF OLD.status IN ('active', 'funded', 'completed') THEN
    IF NEW.goal_amount IS DISTINCT FROM OLD.goal_amount THEN
      RAISE EXCEPTION '掲載中の目標金額は変更できません'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.end_date IS DISTINCT FROM OLD.end_date THEN
      RAISE EXCEPTION '掲載中の募集期限は変更できません'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_project_writes() FROM PUBLIC, anon, authenticated;

-- ============================================
-- 2) 支援が入ったリターンは凍結する
-- ============================================
-- 「支援が入っているか」で判断する。誰も選んでいないリターンの手直しは
-- ページの編集と変わらないので通す。

CREATE OR REPLACE FUNCTION public.reward_has_backers(p_reward_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.backer_items bi
    JOIN public.backers b ON b.id = bi.backer_id
    WHERE bi.reward_id = p_reward_id AND b.status = 'paid'
  ) OR EXISTS (
    SELECT 1 FROM public.backers b
    WHERE b.reward_id = p_reward_id AND b.status = 'paid'
  );
$$;

-- guard_reward_writes は SECURITY INVOKER なので、呼び出した本人に EXECUTE が
-- 必要になる。剥がすとリターンの編集そのものが permission denied で落ちる。
-- 返るのは真偽値だけで、残数は元から公開している情報。
REVOKE EXECUTE ON FUNCTION public.reward_has_backers(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reward_has_backers(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guard_reward_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_writer() OR public.is_admin(auth.uid()) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF public.reward_has_backers(OLD.id) THEN
      RAISE EXCEPTION '支援を受けたリターンは削除できません'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN OLD;
  END IF;

  -- 消化数は backer_items から自動計算する列。手で書き換えさせない
  IF NEW.quantity_claimed IS DISTINCT FROM OLD.quantity_claimed THEN
    RAISE EXCEPTION 'リターンの消化数は支援の記録から自動で更新されます'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 用意した数を、すでに出た数より下へは動かせない
  IF NEW.quantity_total IS NOT NULL
     AND NEW.quantity_total < COALESCE(OLD.quantity_claimed, 0) THEN
    RAISE EXCEPTION '用意数を既に支援された数（%）より少なくはできません', OLD.quantity_claimed
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF public.reward_has_backers(OLD.id) THEN
    IF NEW.amount IS DISTINCT FROM OLD.amount THEN
      RAISE EXCEPTION '支援を受けたリターンの金額は変更できません'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.reward_type IS DISTINCT FROM OLD.reward_type THEN
      RAISE EXCEPTION '支援を受けたリターンの種別は変更できません'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.project_id IS DISTINCT FROM OLD.project_id THEN
      RAISE EXCEPTION '支援を受けたリターンは別のプロジェクトへ移せません'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_reward_writes() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_reward_writes ON public.rewards;
CREATE TRIGGER guard_reward_writes
  BEFORE UPDATE OR DELETE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.guard_reward_writes();
