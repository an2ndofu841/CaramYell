-- デジタルリターンをメールで届けた記録。
--
-- 上位プランは下位のリターンも含むため、1件の支援が複数のデジタルリターンを
-- 受け取ることがある。backers.digital_delivered_at（支援単位）では
-- 「どのリターンを送ったか」が分からないので、リターン×支援の単位で残す。
--
-- 書き込みはサーバー側の API が service_role で行い、掲載者には閲覧だけ許す。

CREATE TABLE IF NOT EXISTS public.reward_deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
  backer_id UUID REFERENCES public.backers(id) ON DELETE CASCADE NOT NULL,
  -- 送った時点の宛先。支援者がアドレスを変えても、どこへ送ったかを追える
  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- 再送したら上書きする（最後に送った日時を見せる）
  UNIQUE (reward_id, backer_id)
);

CREATE INDEX IF NOT EXISTS idx_reward_deliveries_project
  ON public.reward_deliveries(project_id);

ALTER TABLE public.reward_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view reward deliveries" ON public.reward_deliveries
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE creator_id = auth.uid())
    OR public.is_admin(auth.uid())
  );
