import { StatusBadge } from '../../../components/ui/status-badge';
import { statusFromExpiry } from '../../../lib/expiry';
import { apiFetch } from '../../../lib/api';

interface InstructorDetail {
  id: string;
  full_name: string;
  cpf: string;
  anac_registration: string | null;
  qualifications: { id: string; aircraft_type: string; expires_at: string }[];
  cmas: { id: string; expires_at: string }[];
  proficiencies: { id: string; valid_until: string }[];
}

export default async function InstructorDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const instructor = await apiFetch<InstructorDetail>(`/personnel/instructors/${params.id}`);

  if (!instructor) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Instrutor não encontrado ou API indisponível.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{instructor.full_name}</h1>
      <p className="mb-6 text-sm text-slate-500">
        CPF {instructor.cpf} · Registro ANAC {instructor.anac_registration ?? '—'}
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-slate-900">
          Qualificações de aeronave (máx. 2 — RN-17)
        </h2>
        <div className="space-y-2">
          {instructor.qualifications.map((qualification) => (
            <div
              key={qualification.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
            >
              <span>{qualification.aircraft_type}</span>
              <StatusBadge status={statusFromExpiry(qualification.expires_at)} />
            </div>
          ))}
          {instructor.qualifications.length === 0 && (
            <p className="text-slate-400">Nenhuma qualificação registrada.</p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-slate-900">CMA</h2>
        <div className="space-y-2">
          {instructor.cmas.map((cma) => (
            <div
              key={cma.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
            >
              <span>Validade: {cma.expires_at}</span>
              <StatusBadge status={statusFromExpiry(cma.expires_at)} />
            </div>
          ))}
          {instructor.cmas.length === 0 && <p className="text-slate-400">Nenhum CMA registrado.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-900">Proficiência anual (RN-16)</h2>
        <div className="space-y-2">
          {instructor.proficiencies.map((proficiency) => (
            <div
              key={proficiency.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
            >
              <span>Válido até: {proficiency.valid_until}</span>
              <StatusBadge status={statusFromExpiry(proficiency.valid_until)} />
            </div>
          ))}
          {instructor.proficiencies.length === 0 && (
            <p className="text-slate-400">Nenhuma proficiência registrada.</p>
          )}
        </div>
      </section>
    </main>
  );
}
