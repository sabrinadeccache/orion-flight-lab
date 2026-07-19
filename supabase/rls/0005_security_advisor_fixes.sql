-- 0005_security_advisor_fixes.sql
-- Addresses Supabase security advisor warnings after 0001-0004:
--   1. function_search_path_mutable on public.set_updated_at
--   2. function_search_path_mutable on public.storage_object_organization_id
--   3. anon/authenticated can execute public.rls_auto_enable() via PostgREST RPC
--      (platform-installed event trigger helper, not meant to be called directly)

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.storage_object_organization_id(text) set search_path = public, pg_temp;

-- rls_auto_enable() is installed by the hosted Supabase platform itself (an
-- internal event-trigger helper), not by our own migrations — it does not
-- exist on a self-hosted/local stack (supabase start), so guard the revokes
-- instead of failing the whole migration run there (found running the
-- test-e2e CI job against a fresh local stack, 2026-07-19).
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from anon;
    revoke execute on function public.rls_auto_enable() from authenticated;
    revoke execute on function public.rls_auto_enable() from public;
  end if;
end $$;
