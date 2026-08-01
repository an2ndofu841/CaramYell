-- ============================================
-- 019: プロジェクトページのデザインテーマ
-- 掲載者がテンプレートを選び、色やフォントを個別調整できるようにする
-- ============================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS theme JSONB;

COMMENT ON COLUMN public.projects.theme IS
  'プロジェクトページの配色・フォント設定。NULL の場合は既定テーマ（caramel）。';

-- プレビュー用 RPC は to_jsonb(p) で projects の全カラムを返すため、
-- theme カラムは定義を変えずにそのまま含まれる。
