-- 返礼品の発送管理。
-- 1) 支援ごとの発送ステータス・追跡番号
-- 2) 複数リターン購入に対応する明細（何を何個送るか）

-- ============================================
-- 発送ステータス
-- ============================================
ALTER TABLE public.backers
  ADD COLUMN IF NOT EXISTS shipping_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (shipping_status IN ('pending', 'preparing', 'shipped', 'delivered')),
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipping_carrier TEXT,
  ADD COLUMN IF NOT EXISTS fulfillment_note TEXT;

CREATE INDEX IF NOT EXISTS idx_backers_shipping_status
  ON public.backers(project_id, shipping_status);

-- ============================================
-- 支援明細（リターンごとの個数）
-- ============================================
CREATE TABLE IF NOT EXISTS public.backer_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  backer_id UUID REFERENCES public.backers(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL,
  reward_title TEXT NOT NULL,       -- 当時の名称を保持（リターンが編集・削除されても残す）
  unit_amount BIGINT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  needs_address BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backer_items_backer ON public.backer_items(backer_id);

ALTER TABLE public.backer_items ENABLE ROW LEVEL SECURITY;

-- 明細はプロジェクト作成者と管理者が閲覧できる
CREATE POLICY "Creators can view backer items" ON public.backer_items
  FOR SELECT USING (
    backer_id IN (
      SELECT b.id FROM public.backers b
      JOIN public.projects p ON p.id = b.project_id
      WHERE p.creator_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- ============================================
-- 作成者が自分のプロジェクトの支援情報を更新できる（発送ステータス更新用）
-- ============================================
CREATE POLICY "Creators can update own project backers" ON public.backers
  FOR UPDATE USING (
    project_id IN (SELECT id FROM public.projects WHERE creator_id = auth.uid())
  );
