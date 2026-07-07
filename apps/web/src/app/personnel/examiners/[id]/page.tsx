import Link from 'next/link';
import { StatusBadge } from '../../../../components/ui/status-badge';
import { statusFromExpiry } from '../../../../lib/expiry';
import { apiFetch } from '../../../../lib/api';

interface ExaminerDetail {
  id: string;
  full_name: string;
  cpf: string;
  anac_accreditation: string | null;
  qualifications: { id: string; aircraft_type: string; expires_at: string }[];
}

export default async function ExaminerDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const examiner = await apiFetch<ExaminerDetail>(`/personnel/examiners/${params.id}`);

  if (!examiner) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Examinador não encontrado ou API indisponível.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{examiner.full_name}</h1>
        <Link
          href={`/personnel/examiners/${params.id}/edit`}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Editar
        </Link>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        CPF {examiner.cpf} · Credenciamento ANAC {examiner.anac_accreditation ?? '—'}
      </p>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-900">
          Credenciamentos de aeronave (máx. 2 — RN-18)
        </h2>
        <div className="space-y-2">
          {examiner.qualifications.map((qualification) => (
            <div
              key={qualification.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
            >
              <span>{qualification.aircraft_type}</span>
              <StatusBadge status={statusFromExpiry(qualification.expires_at)} />
            </div>
          ))}
          {examiner.qualifications.length === 0 && (
            <p className="text-slate-400">Nenhum credenciamento registrado.</p>
          )}
        </div>
      </section>
    </main>
  );
}
