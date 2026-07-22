-- コメント欄を掲載者がON/OFFできるようにする。
-- true: プロジェクト詳細にコメントタブを表示する
-- false: コメントを受け付けない（タブ非表示）

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN NOT NULL DEFAULT TRUE;
