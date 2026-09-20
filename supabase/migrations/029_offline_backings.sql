-- 現地（会場）で現金を受け取った支援を、掲載者がダッシュボードから記録できるようにする。
--
-- 登録はサーバー側の API が service_role で行う（掲載者の INSERT ポリシーは
-- 020 で外してあり、ここでも復活させない）。集計（current_amount / backer_count /
-- quantity_claimed）は既存のトリガーがそのまま拾う。

-- ============================================
-- 1) メールアドレスは現金支援のみ任意にする
-- ============================================
-- 会場でメールアドレスまで聞くのは現実的でないことが多い。
-- ただし Stripe 経由の支援では確認メールと本人確認に使うので、
-- 現金以外は引き続き必須にしておく。
ALTER TABLE public.backers
  ALTER COLUMN guest_email DROP NOT NULL;

ALTER TABLE public.backers
  ADD CONSTRAINT backers_guest_email_required_unless_cash
  CHECK (guest_email IS NOT NULL OR payment_method = 'cash');

-- 誰が記録したか（掲載者アカウント）。取り消しや問い合わせのときに追える
ALTER TABLE public.backers
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.backers.recorded_by IS
  '現地支援を記録した掲載者。Stripe 経由の支援では NULL';

-- ============================================
-- 2) 人数集計：メール無しの支援者も 1 人として数える
-- ============================================
-- 015 の定義は識別キーを user_id → メールの順で取っていたので、両方 NULL だと
-- NULL 同士の比較が常に偽になり、追加時は 1 人と数えるが、count(DISTINCT) で
-- 引き直すと 0 人になって食い違う。行 id を最後の拠り所にして揃える。
CREATE OR REPLACE FUNCTION public.update_project_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_identity TEXT;
  v_other_backings INTEGER;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    v_identity := coalesce(NEW.user_id::text, lower(btrim(NEW.guest_email)), NEW.id::text);
    SELECT count(*) INTO v_other_backings
    FROM public.backers b
    WHERE b.project_id = NEW.project_id
      AND b.id <> NEW.id
      AND b.status = 'paid'
      AND coalesce(b.user_id::text, lower(btrim(b.guest_email)), b.id::text) = v_identity;

    UPDATE public.projects
    SET
      current_amount = current_amount + NEW.amount,
      backer_count = backer_count + CASE WHEN v_other_backings = 0 THEN 1 ELSE 0 END
    WHERE id = NEW.project_id;
  END IF;

  IF OLD.status = 'paid' AND NEW.status = 'refunded' THEN
    v_identity := coalesce(OLD.user_id::text, lower(btrim(OLD.guest_email)), OLD.id::text);
    SELECT count(*) INTO v_other_backings
    FROM public.backers b
    WHERE b.project_id = OLD.project_id
      AND b.id <> OLD.id
      AND b.status = 'paid'
      AND coalesce(b.user_id::text, lower(btrim(b.guest_email)), b.id::text) = v_identity;

    UPDATE public.projects
    SET
      current_amount = current_amount - OLD.amount,
      -- 他にも支援が残っている人は、まだ応援者として数える
      backer_count = backer_count - CASE WHEN v_other_backings = 0 THEN 1 ELSE 0 END
    WHERE id = OLD.project_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 021 で外した実行権限は CREATE OR REPLACE でも残るが、念のため明示しておく
REVOKE EXECUTE ON FUNCTION public.update_project_stats() FROM PUBLIC, anon, authenticated;
