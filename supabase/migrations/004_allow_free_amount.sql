-- 金額自由（リターンなし）の応援を受け付けるかどうかを掲載者が選べるようにする。
-- true: 応援ページで「金額を自由に指定する」オプションを表示する
-- false: リターン選択のみ

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS allow_free_amount BOOLEAN NOT NULL DEFAULT TRUE;
