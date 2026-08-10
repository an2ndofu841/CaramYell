-- ストーリーの英語版。
-- title / tagline / description には最初から _en があったが story だけ無く、
-- 英語に切り替えた人にはストーリーだけ日本語のまま残ってしまう。
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS story_en TEXT;

COMMENT ON COLUMN public.projects.story_en IS
  '英語表示用のストーリー。任意。空なら story（日本語）を表示する。';
