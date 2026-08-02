-- セキュリティ強化。anon キーはブラウザに配られているため、
-- 「アプリを通さず PostgREST を直接叩かれても壊れないか」を基準に権限を締め直す。
--
-- 1) backers はサーバー（service_role）だけが書けるようにする
-- 2) projects / backers で掲載者が触ってよい列を限定する
-- 3) 下書きプロジェクトのリターン・段階ゴールを非公開にする
-- 4) 在庫（rewards.quantity_claimed）を実際の購入個数から算出する

-- ============================================
-- 共通ヘルパー
-- ============================================

-- service_role（webhook / 決済記録）か、マイグレーション等の直接接続かどうか。
--
-- 呼び出し側の権限で判定する必要があるため、これを使う関数は
-- SECURITY DEFINER にしてはいけない（DEFINER 内では current_user が
-- 関数の所有者になり、常に特権ありと判定されてしまう）。
CREATE OR REPLACE FUNCTION public.is_privileged_writer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT coalesce(auth.role(), '') = 'service_role'
      OR current_user IN ('postgres', 'service_role', 'supabase_admin');
$$;

-- is_admin は search_path が固定されていなかった。
-- なお EXECUTE は絞らない：anon 向けの RLS ポリシーからも呼ばれるため。
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role = 'admin'
  );
$$;

-- ============================================
-- 1) 支援レコードの偽造を止める
-- ============================================
-- これまでは WITH CHECK (true) だったため、匿名クライアントが
-- status='paid' の行を直接 INSERT でき、集計トリガー経由で
-- current_amount / backer_count を実決済なしに水増しできた。
-- アプリ側にクライアントからの INSERT は存在せず、決済記録は
-- record-backing.ts が service_role で行うため、ポリシーごと削除する。
DROP POLICY IF EXISTS "Anyone can create backing" ON public.backers;

-- ============================================
-- 2) 列単位の書き込み制限
-- ============================================

-- 掲載者は自分のプロジェクトを UPDATE できるが、
-- 集計値・掲載ステータス・審査結果まで書き換えられてしまっていた。
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

  -- 掲載者が自分で公開（active）にできないようにする。
  -- 公開後・終了後のプロジェクトを下書きに戻すのも禁止（支援受付中の巻き戻し防止）。
  -- 却下されたプロジェクト（cancelled）の再申請だけは通す。
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status NOT IN ('draft', 'reviewing', 'cancelled')
       OR NEW.status NOT IN ('draft', 'reviewing') THEN
      RAISE EXCEPTION '掲載ステータスを % から % へは変更できません', OLD.status, NEW.status
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_project_writes ON public.projects;
CREATE TRIGGER guard_project_writes
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.guard_project_writes();

-- 掲載者の backers UPDATE は発送管理のためのものなので、その列だけに絞る。
-- （そうしないと status を 'paid' に書き換えて集計を動かせてしまう）
CREATE OR REPLACE FUNCTION public.guard_backer_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_writer() OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  NEW := jsonb_populate_record(
    NEW,
    to_jsonb(OLD) || jsonb_build_object(
      'shipping_status',  to_jsonb(NEW.shipping_status),
      'shipped_at',       to_jsonb(NEW.shipped_at),
      'tracking_number',  to_jsonb(NEW.tracking_number),
      'shipping_carrier', to_jsonb(NEW.shipping_carrier),
      'fulfillment_note', to_jsonb(NEW.fulfillment_note),
      'updated_at',       to_jsonb(NEW.updated_at)
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_backer_writes ON public.backers;
CREATE TRIGGER guard_backer_writes
  BEFORE UPDATE ON public.backers
  FOR EACH ROW EXECUTE FUNCTION public.guard_backer_writes();

-- ============================================
-- 3) 下書きの中身を公開しない
-- ============================================
-- リターンと段階ゴールは USING (true) で全行読めていたため、
-- プロジェクト UUID を知っていれば未公開の内容を取得できた。

DROP POLICY IF EXISTS "Rewards are viewable by everyone" ON public.rewards;
CREATE POLICY "Rewards of visible projects are viewable" ON public.rewards
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE status IN ('active', 'funded', 'completed')
         OR creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Milestones are viewable by everyone" ON public.project_milestones;
CREATE POLICY "Milestones of visible projects are viewable" ON public.project_milestones
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE status IN ('active', 'funded', 'completed')
         OR creator_id = auth.uid()
    )
  );

-- ============================================
-- 4) 在庫カウントを実数に合わせる
-- ============================================
-- 旧トリガーは backers への INSERT で +1 するだけだったため、
--   - 複数リターンをカートで買うと reward_id が空になり一切増えない
--   - 1回で 5 個買っても +1 しか増えない
-- という状態で、数量限定リターンが売り切れにならなかった。
-- 実際の購入明細（backer_items）から毎回引き直す。

CREATE OR REPLACE FUNCTION public.recalc_reward_claimed(p_reward_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.rewards r
  SET quantity_claimed =
    coalesce((
      SELECT sum(bi.quantity)
      FROM public.backer_items bi
      JOIN public.backers b ON b.id = bi.backer_id
      WHERE bi.reward_id = p_reward_id
        AND b.status = 'paid'
    ), 0)
    -- 明細が残っていない旧データ（単一リターン購入）も取りこぼさない
    + coalesce((
      SELECT count(*)
      FROM public.backers b
      WHERE b.reward_id = p_reward_id
        AND b.status = 'paid'
        AND NOT EXISTS (
          SELECT 1 FROM public.backer_items bi2 WHERE bi2.backer_id = b.id
        )
    ), 0)
  WHERE r.id = p_reward_id;
$$;

REVOKE EXECUTE ON FUNCTION public.recalc_reward_claimed(UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.sync_reward_claimed_from_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    IF OLD.reward_id IS NOT NULL THEN
      PERFORM public.recalc_reward_claimed(OLD.reward_id);
    END IF;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    IF NEW.reward_id IS NOT NULL THEN
      PERFORM public.recalc_reward_claimed(NEW.reward_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_reward_claimed_from_items ON public.backer_items;
CREATE TRIGGER sync_reward_claimed_from_items
  AFTER INSERT OR UPDATE OR DELETE ON public.backer_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_reward_claimed_from_items();

-- 支援の status が変わったら（返金など）その支援に紐づくリターンを引き直す
CREATE OR REPLACE FUNCTION public.sync_reward_claimed_from_backer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rid UUID;
BEGIN
  IF NEW.reward_id IS NOT NULL THEN
    PERFORM public.recalc_reward_claimed(NEW.reward_id);
  END IF;
  FOR rid IN
    SELECT DISTINCT bi.reward_id
    FROM public.backer_items bi
    WHERE bi.backer_id = NEW.id AND bi.reward_id IS NOT NULL
  LOOP
    PERFORM public.recalc_reward_claimed(rid);
  END LOOP;
  RETURN NULL;
END;
$$;

-- 旧: backers INSERT で +1 する方式
DROP TRIGGER IF EXISTS on_reward_claimed ON public.backers;
DROP TRIGGER IF EXISTS sync_reward_claimed_from_backer ON public.backers;
CREATE TRIGGER sync_reward_claimed_from_backer
  AFTER INSERT OR UPDATE OF status ON public.backers
  FOR EACH ROW EXECUTE FUNCTION public.sync_reward_claimed_from_backer();

-- 既存データを一度引き直しておく
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.rewards LOOP
    PERFORM public.recalc_reward_claimed(r.id);
  END LOOP;
END $$;
