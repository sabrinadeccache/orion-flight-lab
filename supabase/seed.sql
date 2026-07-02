-- seed.sql
--
-- Minimal local development seed. Never run against a production project.
-- Real Supabase credentials/projects are out of scope for this repository —
-- this file is only meant to bootstrap a local/dev database created from the
-- migrations in supabase/migrations.

insert into public.organizations (id, name, cnpj, anac_ctac_code)
values (
  '00000000-0000-0000-0000-000000000001',
  'CTAC Demonstração',
  '00000000000100',
  'CTAC-DEMO-001'
)
on conflict (id) do nothing;
