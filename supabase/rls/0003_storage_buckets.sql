-- 0003_storage_buckets.sql
--
-- Creates the private Storage buckets used across the platform and scopes
-- access to each bucket by organization_id. The convention is that every
-- object path is prefixed with the owning organization's id, e.g.:
--   {organization_id}/{entity_id}/{filename}
-- so policies can check the first path segment against the caller's JWT
-- claim without needing a join back to a business table.

insert into storage.buckets (id, name, public)
values
  ('regulatory-docs', 'regulatory-docs', false),
  ('certificates', 'certificates', false),
  ('contracts', 'contracts', false),
  ('student-docs', 'student-docs', false),
  ('instructor-docs', 'instructor-docs', false)
on conflict (id) do nothing;

-- Helper: first path segment of the object name, expected to be the
-- organization_id the object belongs to.
create or replace function public.storage_object_organization_id(object_name text)
returns text
language sql
immutable
as $$
  select split_part(object_name, '/', 1);
$$;

-- ---------------------------------------------------------------------------
-- regulatory-docs
-- ---------------------------------------------------------------------------

create policy regulatory_docs_select on storage.objects
  for select
  using (
    bucket_id = 'regulatory-docs'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy regulatory_docs_insert on storage.objects
  for insert
  with check (
    bucket_id = 'regulatory-docs'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy regulatory_docs_update on storage.objects
  for update
  using (
    bucket_id = 'regulatory-docs'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy regulatory_docs_delete on storage.objects
  for delete
  using (
    bucket_id = 'regulatory-docs'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

-- ---------------------------------------------------------------------------
-- certificates
-- ---------------------------------------------------------------------------

create policy certificates_select on storage.objects
  for select
  using (
    bucket_id = 'certificates'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy certificates_insert on storage.objects
  for insert
  with check (
    bucket_id = 'certificates'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy certificates_update on storage.objects
  for update
  using (
    bucket_id = 'certificates'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy certificates_delete on storage.objects
  for delete
  using (
    bucket_id = 'certificates'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

-- ---------------------------------------------------------------------------
-- contracts
-- ---------------------------------------------------------------------------

create policy contracts_bucket_select on storage.objects
  for select
  using (
    bucket_id = 'contracts'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy contracts_bucket_insert on storage.objects
  for insert
  with check (
    bucket_id = 'contracts'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy contracts_bucket_update on storage.objects
  for update
  using (
    bucket_id = 'contracts'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy contracts_bucket_delete on storage.objects
  for delete
  using (
    bucket_id = 'contracts'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

-- ---------------------------------------------------------------------------
-- student-docs
-- ---------------------------------------------------------------------------

create policy student_docs_select on storage.objects
  for select
  using (
    bucket_id = 'student-docs'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy student_docs_insert on storage.objects
  for insert
  with check (
    bucket_id = 'student-docs'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy student_docs_update on storage.objects
  for update
  using (
    bucket_id = 'student-docs'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy student_docs_delete on storage.objects
  for delete
  using (
    bucket_id = 'student-docs'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

-- ---------------------------------------------------------------------------
-- instructor-docs
-- ---------------------------------------------------------------------------

create policy instructor_docs_select on storage.objects
  for select
  using (
    bucket_id = 'instructor-docs'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy instructor_docs_insert on storage.objects
  for insert
  with check (
    bucket_id = 'instructor-docs'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy instructor_docs_update on storage.objects
  for update
  using (
    bucket_id = 'instructor-docs'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy instructor_docs_delete on storage.objects
  for delete
  using (
    bucket_id = 'instructor-docs'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );
