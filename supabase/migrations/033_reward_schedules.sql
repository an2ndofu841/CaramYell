-- 体験リターン（お出かけ・通話など）の日程調整。
--
-- 掲載者が「日程調整」を作って候補の枠（日時・定員）を並べ、対象の支援者へ
-- 案内メールを送る。支援者はメールのリンク（またはマイページ）から枠を1つ選ぶ。
--
-- - 対象者はリターン単位で、発送管理・デジタル送付と同じく上位プランの支援者も含む
-- - 1人（メールアドレス）につき1件の参加枠。同じアドレスの複数支援はまとめる
-- - 支援者はゲストのことが多いので、ログインではなくメールのリンク（トークン）で本人確認する
--   トークンは DB にハッシュだけを残す
-- - 支援者側の読み書きはすべてサーバーの API が service_role で行う。
--   定員を超えないよう、予約は行ロックを取る関数でだけ行う

-- ============================================
-- 日程調整（リターンごと）
-- ============================================
CREATE TABLE IF NOT EXISTS public.reward_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  -- 支援者に見せる案内（内容・持ち物・注意事項など）
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 3000),
  -- 場所や参加方法（集合場所・通話URLなど）。予約した人にだけ見せる
  location TEXT NOT NULL DEFAULT '' CHECK (char_length(location) <= 1000),
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes BETWEEN 5 AND 1440),
  -- 回答（予約・変更）の締切。NULL なら締切なし
  deadline TIMESTAMPTZ,
  -- closed にすると支援者は選び直せない（掲載者側の受付終了）
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_schedules_project
  ON public.reward_schedules(project_id);

-- ============================================
-- 候補の枠
-- ============================================
CREATE TABLE IF NOT EXISTS public.reward_schedule_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  schedule_id UUID REFERENCES public.reward_schedules(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity BETWEEN 1 AND 1000),
  -- 枠ごとの補足（「この回は新宿集合」など）
  note TEXT NOT NULL DEFAULT '' CHECK (char_length(note) <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_schedule_slots_schedule
  ON public.reward_schedule_slots(schedule_id, starts_at);

-- ============================================
-- 対象の支援者（案内を送った人）と、その人が選んだ枠
-- ============================================
CREATE TABLE IF NOT EXISTS public.reward_schedule_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  schedule_id UUID REFERENCES public.reward_schedules(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  -- 小文字・前後空白なしで保存する
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  backer_ids UUID[] NOT NULL DEFAULT '{}',
  token_hash TEXT NOT NULL UNIQUE,
  invited_at TIMESTAMPTZ,
  slot_id UUID REFERENCES public.reward_schedule_slots(id) ON DELETE SET NULL,
  booked_at TIMESTAMPTZ,
  -- 支援者から掲載者への一言（連絡事項）
  message TEXT NOT NULL DEFAULT '' CHECK (char_length(message) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (schedule_id, email)
);

CREATE INDEX IF NOT EXISTS idx_reward_schedule_participants_slot
  ON public.reward_schedule_participants(slot_id);
CREATE INDEX IF NOT EXISTS idx_reward_schedule_participants_email
  ON public.reward_schedule_participants(email);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.reward_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_schedule_participants ENABLE ROW LEVEL SECURITY;

-- 日程調整と枠は、プロジェクトを管理できる人が作成・編集する
CREATE POLICY "Managers can manage reward schedules" ON public.reward_schedules
  FOR ALL
  USING (public.can_manage_project(project_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.can_manage_project(project_id));

CREATE POLICY "Managers can manage reward schedule slots" ON public.reward_schedule_slots
  FOR ALL
  USING (public.can_manage_project(project_id) OR public.is_admin(auth.uid()))
  WITH CHECK (
    public.can_manage_project(project_id)
    AND schedule_id IN (
      SELECT s.id FROM public.reward_schedules s WHERE s.project_id = reward_schedule_slots.project_id
    )
  );

-- 参加者は閲覧だけ。案内・予約の書き込みはサーバーが service_role で行う
CREATE POLICY "Managers can view reward schedule participants" ON public.reward_schedule_participants
  FOR SELECT
  USING (public.can_manage_project(project_id) OR public.is_admin(auth.uid()));

-- ============================================
-- 予約（枠を選ぶ・変更する・取り消す）
-- ============================================
-- 同じ枠に同時に申し込みが来ても定員を超えないよう、枠の行をロックしてから数える。
-- p_slot が NULL なら予約の取り消し。
-- p_force は掲載者が受付終了・締切後に調整するとき用（定員は超えられない）。
-- 戻り値: 'ok' | 'not_found' | 'closed' | 'deadline' | 'full' | 'past'
CREATE OR REPLACE FUNCTION public.book_reward_schedule_slot(
  p_participant UUID,
  p_slot UUID,
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

  IF p_slot IS NULL THEN
    UPDATE public.reward_schedule_participants
    SET slot_id = NULL, booked_at = NULL
    WHERE id = p_participant;
    RETURN 'ok';
  END IF;

  SELECT * INTO v_slot
  FROM public.reward_schedule_slots
  WHERE id = p_slot AND schedule_id = v_participant.schedule_id
  FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;

  IF v_participant.slot_id IS DISTINCT FROM p_slot THEN
    IF NOT p_force AND v_slot.starts_at < NOW() THEN RETURN 'past'; END IF;

    SELECT COUNT(*) INTO v_taken
    FROM public.reward_schedule_participants
    WHERE slot_id = p_slot AND id <> p_participant;
    IF v_taken >= v_slot.capacity THEN RETURN 'full'; END IF;
  END IF;

  UPDATE public.reward_schedule_participants
  SET slot_id = p_slot,
      booked_at = CASE WHEN slot_id IS DISTINCT FROM p_slot THEN NOW() ELSE booked_at END
  WHERE id = p_participant;
  RETURN 'ok';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.book_reward_schedule_slot(UUID, UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_reward_schedule_slot(UUID, UUID, BOOLEAN) TO service_role;

-- 定員を予約数より少なくできないようにする（掲載者の編集ミス対策）
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
    FROM public.reward_schedule_participants
    WHERE slot_id = NEW.id;
    IF v_taken > NEW.capacity THEN
      RAISE EXCEPTION '予約済みの人数（%人）より少ない定員にはできません', v_taken
        USING ERRCODE = '42501';
    END IF;
  END IF;
  -- 枠を別の日程調整・プロジェクトへ付け替えさせない
  NEW.schedule_id := OLD.schedule_id;
  NEW.project_id := OLD.project_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_reward_schedule_slot_capacity ON public.reward_schedule_slots;
CREATE TRIGGER guard_reward_schedule_slot_capacity
  BEFORE UPDATE ON public.reward_schedule_slots
  FOR EACH ROW EXECUTE FUNCTION public.guard_reward_schedule_slot_capacity();

-- 日程調整をほかのプロジェクト・リターンへ付け替えさせない
CREATE OR REPLACE FUNCTION public.guard_reward_schedule_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.rewards r
      WHERE r.id = NEW.reward_id AND r.project_id = NEW.project_id
    ) THEN
      RAISE EXCEPTION 'リターンが見つかりません' USING ERRCODE = '42501';
    END IF;
  ELSE
    NEW.project_id := OLD.project_id;
    NEW.reward_id := OLD.reward_id;
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_reward_schedule_writes ON public.reward_schedules;
CREATE TRIGGER guard_reward_schedule_writes
  BEFORE INSERT OR UPDATE ON public.reward_schedules
  FOR EACH ROW EXECUTE FUNCTION public.guard_reward_schedule_writes();

-- トリガー関数は直接呼ばせない
REVOKE EXECUTE ON FUNCTION public.guard_reward_schedule_slot_capacity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_reward_schedule_writes() FROM PUBLIC, anon, authenticated;
