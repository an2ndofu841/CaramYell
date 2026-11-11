-- 日程調整: 対象の支援者のうち、すでに実施済みの人などを対象から外せるようにする。
--
-- - 対象者は支援データから毎回組み立てるので、外した人はメールアドレス（小文字・前後空白なし）で残す
-- - 外した人には案内を送らず、案内済みのリンクからも回答できない。戻せば元どおり対象になる

ALTER TABLE public.reward_schedules
  ADD COLUMN IF NOT EXISTS excluded_emails TEXT[] NOT NULL DEFAULT '{}'
    CHECK (cardinality(excluded_emails) <= 2000);
