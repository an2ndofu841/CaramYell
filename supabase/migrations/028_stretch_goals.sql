-- 努力目標（最終目標のさらに上に置く、プラスアルファのゴール）
--
-- 段階ゴールは「最上位の段階 = 最終目標」として達成率や達成バッジの分母に
-- なっている。掲載中に段階を1つ足すと最終目標そのものが動き、達成済みの
-- プロジェクトが未達成に戻ってしまう。
--
-- そこで段階ゴールに is_stretch を持たせ、true の行は最終目標の算出から外す。
-- 最終目標を達成したうえで「余った掲載期間でここまで目指す」という
-- 位置づけで、達成率・達成バッジ・一覧カードの分母には一切影響しない。
--
-- 既存行は既定値 false のまま。挙動は何も変わらない。

ALTER TABLE public.project_milestones
  ADD COLUMN IF NOT EXISTS is_stretch BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.project_milestones.is_stretch IS
  '努力目標。true の行は最終目標（達成率の分母）に含めない';

-- ============================================
-- 掲載開始後の段階ゴールを凍結する
-- ============================================
-- 022 で projects.goal_amount は掲載中に動かせなくしたが、段階ゴールが
-- ある案件では実際の分母は project_milestones の最大額なので、こちらも
-- 同じように守らないと意味がない。掲載中に掲載者が触れるのは努力目標だけ。
--
-- - 掲載中の INSERT は is_stretch = true のみ
-- - 掲載中の UPDATE / DELETE は元が努力目標の行のみ（基本の段階へ昇格も不可）
-- - 努力目標の金額は、基本目標（goal_amount と基本の段階すべて）より上
--
-- 運営（admin / service_role）は従来どおり通す。
-- 作成フローは draft / reviewing / cancelled のときだけ子レコードを
-- 作り直すので、このガードには掛からない。

CREATE OR REPLACE FUNCTION public.guard_milestone_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_base_top BIGINT;
  v_project_id UUID;
BEGIN
  IF public.is_privileged_writer() OR public.is_admin(auth.uid()) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_project_id := COALESCE(NEW.project_id, OLD.project_id);

  SELECT p.status INTO v_status
  FROM public.projects p
  WHERE p.id = v_project_id;

  -- 掲載前は従来どおり自由に編集できる
  IF v_status IS NULL OR v_status NOT IN ('active', 'funded', 'completed') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF NOT OLD.is_stretch THEN
      RAISE EXCEPTION '掲載中の段階ゴールは削除できません'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NOT OLD.is_stretch THEN
      RAISE EXCEPTION '掲載中の段階ゴールは変更できません'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.project_id IS DISTINCT FROM OLD.project_id THEN
      RAISE EXCEPTION '努力目標は別のプロジェクトへ移せません'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- INSERT / UPDATE 共通。掲載中に置けるのは努力目標だけ
  IF NOT NEW.is_stretch THEN
    RAISE EXCEPTION '掲載中に追加できるのは努力目標のみです'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 努力目標は最終目標より上に置く。下に置くと達成済みの努力目標が
  -- 生まれて表示が破綻するし、最終目標の意味も曖昧になる
  SELECT GREATEST(
           COALESCE(p.goal_amount, 0),
           COALESCE((
             SELECT MAX(m.amount) FROM public.project_milestones m
             WHERE m.project_id = v_project_id AND NOT m.is_stretch
           ), 0)
         )
    INTO v_base_top
  FROM public.projects p
  WHERE p.id = v_project_id;

  IF NEW.amount <= v_base_top THEN
    RAISE EXCEPTION '努力目標の金額は最終目標（%円）より大きくしてください', v_base_top
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_milestone_writes() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_milestone_writes ON public.project_milestones;
CREATE TRIGGER guard_milestone_writes
  BEFORE INSERT OR UPDATE OR DELETE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.guard_milestone_writes();
