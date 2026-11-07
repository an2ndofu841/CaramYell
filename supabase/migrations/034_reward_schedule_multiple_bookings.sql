-- 日程調整: 同じリターンを複数口支援した人は、その口数分の枠を予約できるようにする。
--
-- 033 では参加者1人に枠1つ（participants.slot_id）だったので、予約を別テーブルに分ける。
-- - 1人が同じ枠を重ねて取ることはできない（別々の枠を口数分まで）
-- - 何口まで予約できるかは支援データから決まるので、DB には持たず、
--   予約時にサーバーが数えて関数へ渡す（関数は service_role だけが呼べる）

CREATE TABLE IF NOT EXISTS public.reward_schedule_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_id UUID REFERENCES public.reward_schedule_participants(id) ON DELETE CASCADE NOT NULL,
  schedule_id UUID REFERENCES public.reward_schedules(id) ON DELETE CASCADE NOT NULL,
  -- 枠を消すと予約も消える（その人はその分「未回答」に戻る）
  slot_id UUID REFERENCES public.reward_schedule_slots(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id, slot_id)
);

CREATE INDEX IF NOT EXISTS idx_reward_schedule_bookings_slot
  ON public.reward_schedule_bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_reward_schedule_bookings_schedule
  ON public.reward_schedule_bookings(schedule_id);

ALTER TABLE public.reward_schedule_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view reward schedule bookings" ON public.reward_schedule_bookings
  FOR SELECT
  USING (public.can_manage_project(project_id) OR public.is_admin(auth.uid()));

-- 033 の予約を移す
INSERT INTO public.reward_schedule_bookings (participant_id, schedule_id, slot_id, project_id, booked_at)
SELECT p.id, p.schedule_id, p.slot_id, p.project_id, COALESCE(p.booked_at, NOW())
FROM public.reward_schedule_participants p
WHERE p.slot_id IS NOT NULL
ON CONFLICT (participant_id, slot_id) DO NOTHING;

DROP FUNCTION IF EXISTS public.book_reward_schedule_slot(UUID, UUID, BOOLEAN);

ALTER TABLE public.reward_schedule_participants
  DROP COLUMN IF EXISTS slot_id,
  DROP COLUMN IF EXISTS booked_at;

-- ============================================
-- 予約をまとめて置き換える
-- ============================================
-- p_slots: 予約したい枠の一覧（空なら全部取り消し）。いまの予約との差分だけ追加・削除する。
-- p_max: 予約できる枠数（支援の口数）。サーバーが支援データから数えて渡す。
-- 同時に申し込みが来ても定員を超えないよう、追加する枠の行を id 順にロックしてから数える。
-- 戻り値: 'ok' | 'not_found' | 'closed' | 'deadline' | 'full' | 'past' | 'too_many'
CREATE OR REPLACE FUNCTION public.set_reward_schedule_bookings(
  p_participant UUID,
  p_slots UUID[],
  p_max INTEGER,
  p_force BOOLEAN DEFAULT FALSE
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant public.reward_schedule_participants%ROWTYPE;
  v_schedule public.reward_schedules%ROWTYPE;
  v_wanted UUID[];
  v_slot public.reward_schedule_slots%ROWTYPE;
  v_taken INTEGER;
BEGIN
  SELECT * INTO v_participant
  FROM public.reward_schedule_participants
  WHERE id = p_participant
  FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;

  SELECT * INTO v_schedule FROM public.reward_schedules WHERE id = v_participant.schedule_id;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;

  IF NOT p_force THEN
    IF v_schedule.status <> 'open' THEN RETURN 'closed'; END IF;
    IF v_schedule.deadline IS NOT NULL AND v_schedule.deadline < NOW() THEN
      RETURN 'deadline';
    END IF;
  END IF;

  SELECT COALESCE(array_agg(DISTINCT s ORDER BY s), '{}') INTO v_wanted
  FROM unnest(COALESCE(p_slots, '{}')) AS s;

  IF cardinality(v_wanted) > GREATEST(p_max, 0) THEN RETURN 'too_many'; END IF;

  -- 追加する枠だけを確かめる（いま持っている枠は過去になっていても持ち続けられる）
  FOR v_slot IN
    SELECT sl.* FROM public.reward_schedule_slots sl
    WHERE sl.id = ANY (v_wanted)
      AND sl.schedule_id = v_participant.schedule_id
      AND NOT EXISTS (
        SELECT 1 FROM public.reward_schedule_bookings b
        WHERE b.participant_id = p_participant AND b.slot_id = sl.id
      )
    ORDER BY sl.id
    FOR UPDATE OF sl
  LOOP
    IF NOT p_force AND v_slot.starts_at < NOW() THEN RETURN 'past'; END IF;
    SELECT COUNT(*) INTO v_taken FROM public.reward_schedule_bookings WHERE slot_id = v_slot.id;
    IF v_taken >= v_slot.capacity THEN RETURN 'full'; END IF;
  END LOOP;

  -- 別の日程調整の枠や、存在しない枠が混ざっていないか
  IF (
    SELECT COUNT(*) FROM public.reward_schedule_slots
    WHERE id = ANY (v_wanted) AND schedule_id = v_participant.schedule_id
  ) <> cardinality(v_wanted) THEN
    RETURN 'not_found';
  END IF;

  DELETE FROM public.reward_schedule_bookings
  WHERE participant_id = p_participant AND NOT (slot_id = ANY (v_wanted));

  INSERT INTO public.reward_schedule_bookings (participant_id, schedule_id, slot_id, project_id)
  SELECT p_participant, v_participant.schedule_id, s, v_participant.project_id
  FROM unnest(v_wanted) AS s
  ON CONFLICT (participant_id, slot_id) DO NOTHING;

  RETURN 'ok';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_reward_schedule_bookings(UUID, UUID[], INTEGER, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_reward_schedule_bookings(UUID, UUID[], INTEGER, BOOLEAN) TO service_role;

-- 定員の下限チェックを予約テーブルで数えるように直す
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
      RAISE EXCEPTION '予約済みの人数（%人）より少ない定員にはできません', v_taken
        USING ERRCODE = '42501';
    END IF;
  END IF;
  NEW.schedule_id := OLD.schedule_id;
  NEW.project_id := OLD.project_id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_reward_schedule_slot_capacity() FROM PUBLIC, anon, authenticated;
