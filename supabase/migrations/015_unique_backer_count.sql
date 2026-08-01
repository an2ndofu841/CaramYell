-- backer_count を「支援した回数」ではなく「応援した人数」にする。
-- 同じ人が追加で支援したときに人数が増えると、応援の広がりを実際より大きく見せてしまう。
-- 同一人物の判定は、ログイン支援なら user_id、ゲスト支援ならメールアドレス。

CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_identity TEXT;
  v_other_backings INTEGER;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    v_identity := coalesce(NEW.user_id::text, lower(btrim(NEW.guest_email)));
    SELECT count(*) INTO v_other_backings
    FROM public.backers b
    WHERE b.project_id = NEW.project_id
      AND b.id <> NEW.id
      AND b.status = 'paid'
      AND coalesce(b.user_id::text, lower(btrim(b.guest_email))) = v_identity;

    UPDATE public.projects
    SET
      current_amount = current_amount + NEW.amount,
      backer_count = backer_count + CASE WHEN v_other_backings = 0 THEN 1 ELSE 0 END
    WHERE id = NEW.project_id;
  END IF;

  IF OLD.status = 'paid' AND NEW.status = 'refunded' THEN
    v_identity := coalesce(OLD.user_id::text, lower(btrim(OLD.guest_email)));
    SELECT count(*) INTO v_other_backings
    FROM public.backers b
    WHERE b.project_id = OLD.project_id
      AND b.id <> OLD.id
      AND b.status = 'paid'
      AND coalesce(b.user_id::text, lower(btrim(b.guest_email))) = v_identity;

    UPDATE public.projects
    SET
      current_amount = current_amount - OLD.amount,
      -- 他にも支援が残っている人は、まだ応援者として数える
      backer_count = backer_count - CASE WHEN v_other_backings = 0 THEN 1 ELSE 0 END
    WHERE id = OLD.project_id;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- 既存データを新しい定義に合わせ直す
UPDATE public.projects p
SET backer_count = COALESCE(
  (
    SELECT count(DISTINCT coalesce(b.user_id::text, lower(btrim(b.guest_email))))
    FROM public.backers b
    WHERE b.project_id = p.id AND b.status = 'paid'
  ),
  0
);
