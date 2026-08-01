-- 支援をアカウントに紐付ける
--
-- これまで backers.user_id は一度も書き込まれておらず、ログイン中に支援しても
-- 全てゲスト支援として記録されていた。そのため支援履歴を出せないだけでなく、
-- 支援者限定の活動報告（user_id で判定）も誰にも見えていなかった。

-- 既存分は決済時のメールアドレスでアカウントに突き合わせる
UPDATE public.backers b
SET user_id = u.id
FROM auth.users u
WHERE b.user_id IS NULL
  AND b.guest_email IS NOT NULL
  AND lower(trim(b.guest_email)) = lower(u.email);

-- ゲスト支援の後からアカウントを作った人も履歴を辿れるようにする
DROP POLICY IF EXISTS "Backers can view own backing" ON public.backers;
CREATE POLICY "Backers can view own backing" ON public.backers
  FOR SELECT USING (
    user_id = auth.uid()
    OR lower(trim(guest_email)) = lower(auth.jwt() ->> 'email')
  );

CREATE INDEX IF NOT EXISTS idx_backers_email_lower
  ON public.backers(lower(trim(guest_email)));
