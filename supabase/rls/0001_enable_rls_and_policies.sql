-- 0001_enable_rls_and_policies.sql
-- Enables Row Level Security on every business table and creates the
-- multi-tenant isolation policy. audit_log gets a stricter insert-only
-- policy on top of tenant isolation; organizations gets a membership
-- policy based on the same JWT claim.

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tenant-scoped tables: organization_isolation policy
-- ---------------------------------------------------------------------------

alter table public.user_profiles enable row level security;
alter table public.user_profiles force row level security;
create policy organization_isolation on public.user_profiles
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.ctac_satellites enable row level security;
alter table public.ctac_satellites force row level security;
create policy organization_isolation on public.ctac_satellites
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.ctac_remotes enable row level security;
alter table public.ctac_remotes force row level security;
create policy organization_isolation on public.ctac_remotes
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.training_specs enable row level security;
alter table public.training_specs force row level security;
create policy organization_isolation on public.training_specs
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.instructors enable row level security;
alter table public.instructors force row level security;
create policy organization_isolation on public.instructors
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.examiners enable row level security;
alter table public.examiners force row level security;
create policy organization_isolation on public.examiners
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.aircraft_qualifications enable row level security;
alter table public.aircraft_qualifications force row level security;
create policy organization_isolation on public.aircraft_qualifications
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.cmas enable row level security;
alter table public.cmas force row level security;
create policy organization_isolation on public.cmas
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.proficiencies enable row level security;
alter table public.proficiencies force row level security;
create policy organization_isolation on public.proficiencies
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.course_assignments enable row level security;
alter table public.course_assignments force row level security;
create policy organization_isolation on public.course_assignments
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.training_programs enable row level security;
alter table public.training_programs force row level security;
create policy organization_isolation on public.training_programs
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.curricula enable row level security;
alter table public.curricula force row level security;
create policy organization_isolation on public.curricula
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.courses enable row level security;
alter table public.courses force row level security;
create policy organization_isolation on public.courses
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.segments enable row level security;
alter table public.segments force row level security;
create policy organization_isolation on public.segments
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.modules enable row level security;
alter table public.modules force row level security;
create policy organization_isolation on public.modules
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.units enable row level security;
alter table public.units force row level security;
create policy organization_isolation on public.units
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.sub_units enable row level security;
alter table public.sub_units force row level security;
create policy organization_isolation on public.sub_units
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.lessons enable row level security;
alter table public.lessons force row level security;
create policy organization_isolation on public.lessons
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.materials enable row level security;
alter table public.materials force row level security;
create policy organization_isolation on public.materials
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.training_devices enable row level security;
alter table public.training_devices force row level security;
create policy organization_isolation on public.training_devices
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.students enable row level security;
alter table public.students force row level security;
create policy organization_isolation on public.students
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.enrollments enable row level security;
alter table public.enrollments force row level security;
create policy organization_isolation on public.enrollments
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.attendances enable row level security;
alter table public.attendances force row level security;
create policy organization_isolation on public.attendances
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.theory_exams enable row level security;
alter table public.theory_exams force row level security;
create policy organization_isolation on public.theory_exams
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.practical_exams enable row level security;
alter table public.practical_exams force row level security;
create policy organization_isolation on public.practical_exams
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.grades enable row level security;
alter table public.grades force row level security;
create policy organization_isolation on public.grades
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.certificates enable row level security;
alter table public.certificates force row level security;
create policy organization_isolation on public.certificates
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.qualifications enable row level security;
alter table public.qualifications force row level security;
create policy organization_isolation on public.qualifications
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.qualification_expiries enable row level security;
alter table public.qualification_expiries force row level security;
create policy organization_isolation on public.qualification_expiries
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.documents enable row level security;
alter table public.documents force row level security;
create policy organization_isolation on public.documents
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.document_versions enable row level security;
alter table public.document_versions force row level security;
create policy organization_isolation on public.document_versions
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.document_approvals enable row level security;
alter table public.document_approvals force row level security;
create policy organization_isolation on public.document_approvals
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.audit_programs enable row level security;
alter table public.audit_programs force row level security;
create policy organization_isolation on public.audit_programs
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.audits enable row level security;
alter table public.audits force row level security;
create policy organization_isolation on public.audits
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.non_conformities enable row level security;
alter table public.non_conformities force row level security;
create policy organization_isolation on public.non_conformities
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.corrective_actions enable row level security;
alter table public.corrective_actions force row level security;
create policy organization_isolation on public.corrective_actions
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.quality_reports enable row level security;
alter table public.quality_reports force row level security;
create policy organization_isolation on public.quality_reports
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.hazards enable row level security;
alter table public.hazards force row level security;
create policy organization_isolation on public.hazards
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.risks enable row level security;
alter table public.risks force row level security;
create policy organization_isolation on public.risks
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.mitigations enable row level security;
alter table public.mitigations force row level security;
create policy organization_isolation on public.mitigations
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.mgso enable row level security;
alter table public.mgso force row level security;
create policy organization_isolation on public.mgso
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.pre enable row level security;
alter table public.pre force row level security;
create policy organization_isolation on public.pre
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.safety_occurrences enable row level security;
alter table public.safety_occurrences force row level security;
create policy organization_isolation on public.safety_occurrences
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.semestral_reports enable row level security;
alter table public.semestral_reports force row level security;
create policy organization_isolation on public.semestral_reports
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.idso enable row level security;
alter table public.idso force row level security;
create policy organization_isolation on public.idso
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.clients enable row level security;
alter table public.clients force row level security;
create policy organization_isolation on public.clients
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.client_units enable row level security;
alter table public.client_units force row level security;
create policy organization_isolation on public.client_units
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.contacts enable row level security;
alter table public.contacts force row level security;
create policy organization_isolation on public.contacts
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.accounts enable row level security;
alter table public.accounts force row level security;
create policy organization_isolation on public.accounts
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.proposals enable row level security;
alter table public.proposals force row level security;
create policy organization_isolation on public.proposals
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.pipelines enable row level security;
alter table public.pipelines force row level security;
create policy organization_isolation on public.pipelines
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.contracts enable row level security;
alter table public.contracts force row level security;
create policy organization_isolation on public.contracts
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.contract_amendments enable row level security;
alter table public.contract_amendments force row level security;
create policy organization_isolation on public.contract_amendments
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.plans enable row level security;
alter table public.plans force row level security;
create policy organization_isolation on public.plans
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.subscriptions enable row level security;
alter table public.subscriptions force row level security;
create policy organization_isolation on public.subscriptions
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.charges enable row level security;
alter table public.charges force row level security;
create policy organization_isolation on public.charges
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.payments enable row level security;
alter table public.payments force row level security;
create policy organization_isolation on public.payments
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

alter table public.delinquencies enable row level security;
alter table public.delinquencies force row level security;
create policy organization_isolation on public.delinquencies
  for all
  using (organization_id::text = auth.jwt()->>'organization_id')
  with check (organization_id::text = auth.jwt()->>'organization_id');

-- ---------------------------------------------------------------------------
-- organizations: a user may only see/update their own organization
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organizations force row level security;
create policy organization_isolation on public.organizations
  for all
  using (id::text = auth.jwt()->>'organization_id')
  with check (id::text = auth.jwt()->>'organization_id');

-- ---------------------------------------------------------------------------
-- audit_log: tenant-scoped, but INSERT-only. UPDATE/DELETE are always denied,
-- both via RLS (USING (false)) and by revoking the underlying grants from the
-- authenticated role, so the immutability holds even if a policy is
-- misconfigured later (RN-24).
-- ---------------------------------------------------------------------------

alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

create policy audit_log_select on public.audit_log
  for select
  using (organization_id::text = auth.jwt()->>'organization_id');

create policy audit_log_insert_only on public.audit_log
  for insert
  with check (organization_id::text = auth.jwt()->>'organization_id');

create policy audit_log_no_update on public.audit_log
  for update
  using (false);

create policy audit_log_no_delete on public.audit_log
  for delete
  using (false);

revoke update, delete on public.audit_log from authenticated;
revoke update, delete on public.audit_log from anon;
