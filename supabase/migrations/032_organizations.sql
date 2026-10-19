-- 1つの事務所（掲載者）を複数のスタッフアカウントで管理できるようにする
--
-- これまでプロジェクトは projects.creator_id（作った本人）だけで所有を判定していた。
-- 事務所単位で管理できるよう organizations / organization_members を加え、
-- projects.organization_id が入っているプロジェクトは「その事務所のメンバー全員」が
-- 管理できるようにする。
--
-- 既存の行には一切手を入れない（新しいテーブルと NULL 既定の列の追加のみ）。
-- organization_id が NULL のプロジェクトは従来どおり creator_id 本人だけが管理する。

-- ============================================
-- 1) 事務所
-- ============================================
-- name は公開ページに「掲載: ○○」と出る名前。実在の事務所をかたれないよう、
-- 作成・変更は運営（または承認処理）だけが行う。
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are viewable by everyone" ON public.organizations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage organizations" ON public.organizations
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2) メンバー
-- ============================================
-- owner: メンバーの招待・権限変更・削除ができる
-- staff: プロジェクトの作成・編集・支援者対応ができる
-- 当面は1ユーザー1事務所（どの事務所として操作しているかを迷わせない）
CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- RLS の中から使うので SECURITY DEFINER（members の RLS を再帰させない）
CREATE OR REPLACE FUNCTION public.is_org_member(org UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT org IS NOT NULL AND uid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org AND user_id = uid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_org_owner(org UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT org IS NOT NULL AND uid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org AND user_id = uid AND role = 'owner'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_org_owner(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_owner(UUID, UUID) TO anon, authenticated, service_role;

-- 同じ事務所のメンバー同士は一覧を見られる
CREATE POLICY "Members can view own organization members" ON public.organization_members
  FOR SELECT USING (
    public.is_org_member(organization_id, auth.uid())
    OR public.is_admin(auth.uid())
  );

-- 追加は招待の受諾（accept_organization_invitation）か運営だけ
CREATE POLICY "Admins can add organization members" ON public.organization_members
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- 権限の変更はオーナー（と運営）
CREATE POLICY "Owners can update organization members" ON public.organization_members
  FOR UPDATE USING (
    public.is_org_owner(organization_id, auth.uid())
    OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    public.is_org_owner(organization_id, auth.uid())
    OR public.is_admin(auth.uid())
  );

-- 外すのはオーナー（と運営）。スタッフは自分で抜けられる
CREATE POLICY "Owners can remove members and members can leave" ON public.organization_members
  FOR DELETE USING (
    public.is_org_owner(organization_id, auth.uid())
    OR user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- 所属先の付け替えはさせない。オーナーが誰もいない事務所も作らせない
CREATE OR REPLACE FUNCTION public.guard_organization_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.organization_id IS DISTINCT FROM OLD.organization_id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
  ) THEN
    RAISE EXCEPTION 'メンバーの所属先は変更できません'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 事務所ごと消すとき（運営の操作・CASCADE）は止めない
  IF public.is_privileged_writer() OR public.is_admin(auth.uid())
     OR NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = OLD.organization_id) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF OLD.role = 'owner'
     AND (TG_OP = 'DELETE' OR NEW.role <> 'owner')
     AND NOT EXISTS (
       SELECT 1 FROM public.organization_members
       WHERE organization_id = OLD.organization_id
         AND role = 'owner'
         AND user_id <> OLD.user_id
     ) THEN
    RAISE EXCEPTION 'オーナーが1人もいなくなるため変更できません。先に別のメンバーをオーナーにしてください'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_organization_members() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER guard_organization_members
  BEFORE UPDATE OR DELETE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.guard_organization_members();

-- ============================================
-- 3) 招待
-- ============================================
-- 招待リンクのトークンそのものは保存しない（ハッシュだけ）。
-- 受諾できるのは招待したメールアドレスでログインしている人だけ。
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254 AND email = lower(email)),
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  token_hash TEXT NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 同じ相手への未受諾の招待は1件まで（送り直しは古い招待を取り消してから）
CREATE UNIQUE INDEX IF NOT EXISTS organization_invitations_one_open
  ON public.organization_invitations (organization_id, email)
  WHERE accepted_at IS NULL;

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view invitations" ON public.organization_invitations
  FOR SELECT USING (
    public.is_org_owner(organization_id, auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Owners can create invitations" ON public.organization_invitations
  FOR INSERT WITH CHECK (
    public.is_org_owner(organization_id, auth.uid())
    AND invited_by = auth.uid()
    AND accepted_at IS NULL
    AND accepted_by IS NULL
    AND expires_at <= now() + interval '7 days 1 minute'
  );

-- 取り消しは削除で行う（受諾済みの記録は残す）
CREATE POLICY "Owners can cancel open invitations" ON public.organization_invitations
  FOR DELETE USING (
    accepted_at IS NULL
    AND (public.is_org_owner(organization_id, auth.uid()) OR public.is_admin(auth.uid()))
  );

-- 招待リンクを開いた人に、どの事務所からの招待かを見せる。
-- トークンを知っている人（＝メールを受け取った人）しか引けない。
CREATE OR REPLACE FUNCTION public.get_organization_invitation(p_token_hash TEXT)
RETURNS TABLE (
  organization_name TEXT,
  email TEXT,
  role TEXT,
  expires_at TIMESTAMPTZ,
  accepted BOOLEAN
) AS $$
  SELECT o.name, i.email, i.role, i.expires_at, i.accepted_at IS NOT NULL
  FROM public.organization_invitations i
  JOIN public.organizations o ON o.id = i.organization_id
  WHERE i.token_hash = p_token_hash
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.get_organization_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_organization_invitation(TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.accept_organization_invitation(p_token_hash TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.organization_invitations%ROWTYPE;
  uid UUID := auth.uid();
  user_email TEXT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'ログインが必要です' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO inv FROM public.organization_invitations
  WHERE token_hash = p_token_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '招待が見つかりません' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF inv.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'この招待はすでに使われています' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF inv.expires_at < now() THEN
    RAISE EXCEPTION '招待の有効期限が切れています' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT lower(email) INTO user_email FROM auth.users WHERE id = uid;
  IF user_email IS DISTINCT FROM inv.email THEN
    RAISE EXCEPTION '招待されたメールアドレスのアカウントでログインしてください'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = uid) THEN
    RAISE EXCEPTION 'すでに別の事務所に所属しています' USING ERRCODE = 'insufficient_privilege';
  END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
  VALUES (inv.organization_id, uid, inv.role, inv.invited_by);

  UPDATE public.organization_invitations
  SET accepted_at = now(), accepted_by = uid
  WHERE id = inv.id;

  RETURN inv.organization_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_organization_invitation(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_organization_invitation(TEXT) TO authenticated, service_role;

-- メンバー一覧（メールアドレスは auth.users にあるので関数で返す）。
-- 同じ事務所のメンバーだけが引ける。
CREATE OR REPLACE FUNCTION public.list_organization_members(p_org UUID)
RETURNS TABLE (
  user_id UUID,
  role TEXT,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  joined_at TIMESTAMPTZ
) AS $$
  SELECT m.user_id, m.role, pr.display_name, pr.avatar_url, u.email::TEXT, m.created_at
  FROM public.organization_members m
  JOIN public.profiles pr ON pr.id = m.user_id
  LEFT JOIN auth.users u ON u.id = m.user_id
  WHERE m.organization_id = p_org
    AND (public.is_org_member(p_org, auth.uid()) OR public.is_admin(auth.uid()))
  ORDER BY (m.role = 'owner') DESC, m.created_at;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.list_organization_members(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_organization_members(UUID) TO authenticated, service_role;

-- ============================================
-- 4) プロジェクトを事務所にひも付ける
-- ============================================
-- 既存のプロジェクトは NULL のまま（従来どおり作成者本人の管理）
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS organization_id UUID
  REFERENCES public.organizations(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_projects_organization
  ON public.projects(organization_id)
  WHERE organization_id IS NOT NULL;

COMMENT ON COLUMN public.projects.organization_id IS
  '管理する事務所。NULL のときは creator_id 本人だけが管理する';

-- 管理できるか。事務所のプロジェクトは「いまのメンバー」だけ
-- （作った本人でも事務所を抜けたら触れない）。
CREATE OR REPLACE FUNCTION public.manages_project(p_creator UUID, p_org UUID)
RETURNS BOOLEAN AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN p_org IS NULL THEN p_creator = auth.uid()
    ELSE public.is_org_member(p_org, auth.uid())
  END;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_manage_project(p_project UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project
      AND public.manages_project(p.creator_id, p.organization_id)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.manages_project(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_manage_project(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manages_project(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_project(UUID) TO anon, authenticated, service_role;

-- 掲載できる人: 運営が承認した掲載者・管理者、または事務所のメンバー
CREATE OR REPLACE FUNCTION public.is_creator(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role IN ('creator', 'admin')
  ) OR EXISTS (
    SELECT 1 FROM public.organization_members WHERE user_id = uid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================
-- 5) RLS の所有判定を置き換える
-- ============================================

-- projects
DROP POLICY IF EXISTS "Active projects are viewable by everyone" ON public.projects;
CREATE POLICY "Active projects are viewable by everyone" ON public.projects
  FOR SELECT USING (
    status IN ('active', 'funded', 'completed')
    OR public.manages_project(creator_id, organization_id)
  );

DROP POLICY IF EXISTS "Creators can create projects" ON public.projects;
CREATE POLICY "Creators can create projects" ON public.projects
  FOR INSERT WITH CHECK (
    creator_id = auth.uid()
    AND public.is_creator(auth.uid())
    AND (organization_id IS NULL OR public.is_org_member(organization_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Creators can update own projects" ON public.projects;
CREATE POLICY "Creators can update own projects" ON public.projects
  FOR UPDATE USING (public.manages_project(creator_id, organization_id));

-- 削除は作成者本人（いまもメンバーであること）か事務所のオーナー
DROP POLICY IF EXISTS "Creators can delete own projects" ON public.projects;
CREATE POLICY "Creators can delete own projects" ON public.projects
  FOR DELETE USING (
    CASE
      WHEN organization_id IS NULL THEN creator_id = auth.uid()
      ELSE public.is_org_owner(organization_id, auth.uid())
        OR (creator_id = auth.uid() AND public.is_org_member(organization_id, auth.uid()))
    END
  );

-- rewards
DROP POLICY IF EXISTS "Creators can manage rewards" ON public.rewards;
CREATE POLICY "Creators can manage rewards" ON public.rewards
  FOR ALL USING (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "Rewards of visible projects are viewable" ON public.rewards;
CREATE POLICY "Rewards of visible projects are viewable" ON public.rewards
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE status IN ('active', 'funded', 'completed')
    )
    OR public.can_manage_project(project_id)
  );

-- project_milestones
DROP POLICY IF EXISTS "Creators can manage milestones" ON public.project_milestones;
CREATE POLICY "Creators can manage milestones" ON public.project_milestones
  FOR ALL USING (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "Milestones of visible projects are viewable" ON public.project_milestones;
CREATE POLICY "Milestones of visible projects are viewable" ON public.project_milestones
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE status IN ('active', 'funded', 'completed')
    )
    OR public.can_manage_project(project_id)
  );

-- project_updates
DROP POLICY IF EXISTS "Creators can manage updates" ON public.project_updates;
CREATE POLICY "Creators can manage updates" ON public.project_updates
  FOR ALL USING (public.can_manage_project(project_id));

-- comments（下書きのプロジェクトのコメントを管理者側から見る）
DROP POLICY IF EXISTS "Comments of visible projects are viewable" ON public.comments;
CREATE POLICY "Comments of visible projects are viewable" ON public.comments
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE status IN ('active', 'funded', 'completed')
    )
    OR public.can_manage_project(project_id)
  );

-- backers
DROP POLICY IF EXISTS "Creators can view project backers" ON public.backers;
CREATE POLICY "Creators can view project backers" ON public.backers
  FOR SELECT USING (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "Creators can update own project backers" ON public.backers;
CREATE POLICY "Creators can update own project backers" ON public.backers
  FOR UPDATE USING (public.can_manage_project(project_id));

-- backer_items
DROP POLICY IF EXISTS "Creators can view backer items" ON public.backer_items;
CREATE POLICY "Creators can view backer items" ON public.backer_items
  FOR SELECT USING (
    backer_id IN (
      SELECT b.id FROM public.backers b
      WHERE public.can_manage_project(b.project_id)
    )
    OR public.is_admin(auth.uid())
  );

-- reward_deliveries
DROP POLICY IF EXISTS "Creators can view reward deliveries" ON public.reward_deliveries;
CREATE POLICY "Creators can view reward deliveries" ON public.reward_deliveries
  FOR SELECT USING (
    public.can_manage_project(project_id)
    OR public.is_admin(auth.uid())
  );

-- ============================================
-- 6) 事務所の付け替えは運営だけ
-- ============================================
CREATE OR REPLACE FUNCTION public.guard_project_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_writer() OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.creator_id IS DISTINCT FROM OLD.creator_id THEN
    RAISE EXCEPTION '掲載者は変更できません'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION '管理する事務所は変更できません'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.current_amount IS DISTINCT FROM OLD.current_amount
     OR NEW.backer_count IS DISTINCT FROM OLD.backer_count THEN
    RAISE EXCEPTION '支援総額と支援者数は決済処理でのみ更新されます'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.featured IS DISTINCT FROM OLD.featured THEN
    RAISE EXCEPTION '注目プロジェクトの指定は運営のみ変更できます'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION '審査結果は運営のみ更新できます'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status NOT IN ('draft', 'reviewing', 'cancelled')
       OR NEW.status NOT IN ('draft', 'reviewing') THEN
      RAISE EXCEPTION '掲載ステータスを % から % へは変更できません', OLD.status, NEW.status
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  IF OLD.status IN ('active', 'funded', 'completed') THEN
    IF NEW.goal_amount IS DISTINCT FROM OLD.goal_amount THEN
      RAISE EXCEPTION '掲載中の目標金額は変更できません'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.end_date IS DISTINCT FROM OLD.end_date THEN
      RAISE EXCEPTION '掲載中の募集期限は変更できません'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- 7) プレビューにも事務所名を出す
-- ============================================
CREATE OR REPLACE FUNCTION public.get_project_by_preview_token(p_token text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT to_jsonb(p) || jsonb_build_object(
    'profiles', (
      SELECT jsonb_build_object(
        'id', pr.id,
        'username', pr.username,
        'display_name', pr.display_name,
        'avatar_url', pr.avatar_url,
        'bio', pr.bio,
        'website_url', pr.website_url,
        'twitter_handle', pr.twitter_handle,
        'organization_name', pr.organization_name
      )
      FROM public.profiles pr WHERE pr.id = p.creator_id
    ),
    'organizations', (
      SELECT jsonb_build_object('id', o.id, 'name', o.name)
      FROM public.organizations o WHERE o.id = p.organization_id
    ),
    'categories', (SELECT to_jsonb(c) FROM public.categories c WHERE c.id = p.category_id),
    'rewards', (
      SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.sort_order), '[]'::jsonb)
      FROM public.rewards r WHERE r.project_id = p.id
    ),
    'project_milestones', (
      SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.sort_order), '[]'::jsonb)
      FROM public.project_milestones m WHERE m.project_id = p.id
    ),
    'project_updates', (
      SELECT coalesce(jsonb_agg(to_jsonb(u) ORDER BY u.created_at DESC), '[]'::jsonb)
      FROM public.project_updates u
      WHERE u.project_id = p.id AND u.is_backers_only IS NOT TRUE
    )
  )
  FROM public.projects p
  WHERE p.preview_token = p_token
  LIMIT 1;
$function$;
