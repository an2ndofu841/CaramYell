-- 022 で reward_has_backers の EXECUTE を authenticated からも剥がしてしまい、
-- guard_reward_writes（SECURITY INVOKER）から呼べずにリターンの編集が
-- permission denied で落ちていた。022 側も直してあるが、既に適用済みの
-- 環境向けにここでも付け直す。
REVOKE EXECUTE ON FUNCTION public.reward_has_backers(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reward_has_backers(UUID) TO authenticated, service_role;
