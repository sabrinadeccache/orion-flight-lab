-- 0006_lms_content_progress_quizzes.sql
--
-- RLS + updated_at trigger for the new LMS tables (lesson_progresses,
-- quizzes, quiz_questions, quiz_options, quiz_attempts), same
-- organization_isolation policy as every other tenant table.
-- quiz_attempts has no updated_at semantics beyond creation (immutable once
-- submitted), but keeps the column for schema convention consistency.

alter table public.lesson_progresses enable row level security;
alter table public.lesson_progresses force row level security;

create policy organization_isolation on public.lesson_progresses
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

create trigger set_updated_at
  before update on public.lesson_progresses
  for each row
  execute function public.set_updated_at();

alter table public.quizzes enable row level security;
alter table public.quizzes force row level security;

create policy organization_isolation on public.quizzes
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

create trigger set_updated_at
  before update on public.quizzes
  for each row
  execute function public.set_updated_at();

alter table public.quiz_questions enable row level security;
alter table public.quiz_questions force row level security;

create policy organization_isolation on public.quiz_questions
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

create trigger set_updated_at
  before update on public.quiz_questions
  for each row
  execute function public.set_updated_at();

alter table public.quiz_options enable row level security;
alter table public.quiz_options force row level security;

create policy organization_isolation on public.quiz_options
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

create trigger set_updated_at
  before update on public.quiz_options
  for each row
  execute function public.set_updated_at();

alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempts force row level security;

create policy organization_isolation on public.quiz_attempts
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');
