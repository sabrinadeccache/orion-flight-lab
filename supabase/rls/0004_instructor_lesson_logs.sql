-- 0004_instructor_lesson_logs.sql
--
-- Adds instructor_lesson_logs (introduced to support RN-15: an instructor
-- cannot teach more than 8h within any rolling 24h window) with the same
-- tenant-isolation policy and updated_at trigger as every other table.

alter table public.instructor_lesson_logs enable row level security;
alter table public.instructor_lesson_logs force row level security;

create policy organization_isolation on public.instructor_lesson_logs
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

create trigger set_updated_at
  before update on public.instructor_lesson_logs
  for each row
  execute function public.set_updated_at();
