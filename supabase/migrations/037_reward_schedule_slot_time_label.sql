-- 日程調整: 時刻を決めずに日付だけの候補（「ライブ前後」「時間未定」など）を作れるようにする。
--
-- - time_label が空でなければ時間未定の枠。時刻の代わりにこの表記を見せる
-- - starts_at はその日の 23:59（日本時間）にしておく。当日いっぱい選べて、同じ日の時刻ありの枠の後ろに並ぶ

ALTER TABLE public.reward_schedule_slots
  ADD COLUMN IF NOT EXISTS time_label TEXT NOT NULL DEFAULT ''
    CHECK (char_length(time_label) <= 30);
