-- プロジェクトのメイン画像とギャラリー用のバケット。
-- projects.main_image_url / projects.images の列は最初からあったが、
-- 保存先が無かったため掲載者が画像を設定する手段が存在しなかった。
--
-- avatars と同じく、書き込みは API ルート（service role）だけを通す。
-- 一般ユーザー向けの storage ポリシーは作らない。
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images',
  true,
  5242880, -- 5MB。トップに大きく出る画像なのでアバターより緩める
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
