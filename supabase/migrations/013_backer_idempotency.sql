-- 支援の二重計上を防ぐ。
-- Stripe は同じ checkout.session.completed を複数回送ることがあり、
-- さらに成功ページ側のフォールバック確定と webhook が同時に走る場合もあるため、
-- Checkout セッション単位で一意にして ON CONFLICT DO NOTHING を効かせる。

ALTER TABLE public.backers
  ADD CONSTRAINT backers_stripe_session_id_key UNIQUE (stripe_session_id);
