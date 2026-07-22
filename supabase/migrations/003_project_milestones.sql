-- 段階的ゴール（ストレッチゴール）
-- アイドルの生誕・記念などで「¥5万でフラスタ / ¥10万で新衣装 / ¥15万で新曲…」のように
-- 段階的な達成目標を設定し、達成した段階まで実施する用途に対応する。

CREATE TABLE public.project_milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  amount BIGINT NOT NULL,          -- 達成に必要な金額（円）
  title TEXT NOT NULL,             -- 例: フラスタ / 新衣装 / 新曲
  description TEXT,                -- 任意の補足
  sort_order INTEGER DEFAULT 0,    -- 表示順（金額昇順を想定）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_milestones_project ON public.project_milestones(project_id);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones are viewable by everyone" ON public.project_milestones
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage milestones" ON public.project_milestones
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE creator_id = auth.uid())
  );
