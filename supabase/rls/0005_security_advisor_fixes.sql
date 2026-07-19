-- 0005_security_advisor_fixes.sql
-- Addresses Supabase security advisor warnings after 0001-0004:
--   1. function_search_path_mutable on public.set_updated_at
--   2. function_search_path_mutable on public.storage_object_organization_id
--   3. anon/authenticated can execute public.rls_auto_enable() via PostgREST RPC
--      (platform-installed event trigger helper, not meant to be called directly)

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.storage_object_organization_id(text) set search_path = public, pg_temp;

revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;

revoke execute on function public.rls_auto_enable() from public;
