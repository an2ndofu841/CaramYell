-- 掲載者が自分で書くよくある質問。
-- 詳細ページの FAQ はプラットフォーム共通の固定文だけで、
-- 「このリターンは〇〇に使えますか」のような個別の疑問に答える場所が無かった。
--
-- 件数も文字数も API 側（resolveFaqs）で刈り込んでから入れる。
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS faqs JSONB;

COMMENT ON COLUMN public.projects.faqs IS
  '掲載者が入力するよくある質問。[{q, a, q_en, a_en}] の配列。任意。';
