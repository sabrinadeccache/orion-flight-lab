-- 0002_set_updated_at_trigger.sql
-- Generic trigger function that keeps updated_at current on every UPDATE,
-- applied to all tables that have an updated_at column (all except
-- audit_log, which is immutable by design).

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.user_profiles
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.organizations
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.ctac_satellites
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.ctac_remotes
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.training_specs
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.instructors
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.examiners
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.aircraft_qualifications
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.cmas
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.proficiencies
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.course_assignments
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.training_programs
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.curricula
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.courses
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.segments
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.modules
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.units
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.sub_units
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.lessons
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.materials
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.training_devices
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.students
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.enrollments
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.attendances
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.theory_exams
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.practical_exams
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.grades
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.certificates
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.qualifications
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.qualification_expiries
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.documents
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.document_versions
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.document_approvals
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.audit_programs
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.audits
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.non_conformities
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.corrective_actions
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.quality_reports
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.hazards
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.risks
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.mitigations
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.mgso
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.pre
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.safety_occurrences
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.semestral_reports
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.idso
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.client_units
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.contacts
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.accounts
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.proposals
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.pipelines
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.contracts
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.contract_amendments
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.plans
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.charges
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.payments
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.delinquencies
  for each row
  execute function public.set_updated_at();
