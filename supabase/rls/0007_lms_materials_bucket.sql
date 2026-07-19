-- 0007_lms_materials_bucket.sql
--
-- Private bucket for LMS Material uploads (slides/PDF/short video files),
-- same organization-scoped-path convention as every other bucket (see
-- 0003_storage_buckets.sql for storage_object_organization_id()).

insert into storage.buckets (id, name, public)
values ('lms-materials', 'lms-materials', false)
on conflict (id) do nothing;

create policy lms_materials_select on storage.objects
  for select
  using (
    bucket_id = 'lms-materials'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy lms_materials_insert on storage.objects
  for insert
  with check (
    bucket_id = 'lms-materials'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy lms_materials_update on storage.objects
  for update
  using (
    bucket_id = 'lms-materials'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );

create policy lms_materials_delete on storage.objects
  for delete
  using (
    bucket_id = 'lms-materials'
    and public.storage_object_organization_id(name) = auth.jwt()->>'organization_id'
  );
