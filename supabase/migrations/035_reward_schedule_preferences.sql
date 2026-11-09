-- 日程調整: 支援者が枠を先着で予約する形から、「希望を聞いて掲載者が確定する」形にする。
--
-- - 支援者は候補の枠から第3希望までを選ぶ（preferred_slot_ids の並び順が希望順）
-- - 候補に合う日時が無ければ「その他」に自由記入できる（掲載者が allow_other で出し分ける）
-- - 掲載者は質問（自由記入の入力欄）を足せる。通話の候補日時を書いてもらう、など
-- - 確定した日程は 034 の reward_schedule_bookings に入れる（掲載者が service_role 経由で書く）
-- - 確定のお知らせを送った時点の確定枠を notified_slot_ids に残し、未送信の変更を見分ける

ALTER TABLE public.reward_schedules
  ADD COLUMN IF NOT EXISTS allow_other BOOLEAN NOT NULL DEFAULT TRUE,
  -- [{ "id": "...", "label": "...", "placeholder": "...", "required": true }]
  ADD COLUMN IF NOT EXISTS questions JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(questions) = 'array' AND jsonb_array_length(questions) <= 10);

ALTER TABLE public.reward_schedule_participants
  ADD COLUMN IF NOT EXISTS preferred_slot_ids UUID[] NOT NULL DEFAULT '{}'
    CHECK (cardinality(preferred_slot_ids) <= 3),
  ADD COLUMN IF NOT EXISTS other_text TEXT NOT NULL DEFAULT ''
    CHECK (char_length(other_text) <= 1000),
  -- { "質問のid": "回答" }
  ADD COLUMN IF NOT EXISTS answers JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(answers) = 'object'),
  -- 最初に回答した日時（自動割り当ては回答の早い順）
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notified_slot_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- 「予約」ではなく「確定」になったので、定員チェックの文言だけ直す
CREATE OR REPLACE FUNCTION public.guard_reward_schedule_slot_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_taken INTEGER;
BEGIN
  IF NEW.capacity < OLD.capacity THEN
    SELECT COUNT(*) INTO v_taken
    FROM public.reward_schedule_bookings
    WHERE slot_id = NEW.id;
    IF v_taken > NEW.capacity THEN
      RAISE EXCEPTION '確定済みの人数（%人）より少ない定員にはできません', v_taken
        USING ERRCODE = '42501';
    END IF;
  END IF;
  NEW.schedule_id := OLD.schedule_id;
  NEW.project_id := OLD.project_id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_reward_schedule_slot_capacity() FROM PUBLIC, anon, authenticated;
