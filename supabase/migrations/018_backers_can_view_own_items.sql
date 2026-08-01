-- 支援者が自分の支援明細を読めるようにする
--
-- 明細の閲覧はプロジェクト作成者と管理者に限られていたため、支援者本人が
-- 「何を買ったか」をマイページで確認できなかった。

CREATE POLICY "Backers can view own items" ON public.backer_items
  FOR SELECT USING (
    backer_id IN (
      SELECT b.id FROM public.backers b
      WHERE b.user_id = auth.uid()
         OR lower(trim(b.guest_email)) = lower(auth.jwt() ->> 'email')
    )
  );
