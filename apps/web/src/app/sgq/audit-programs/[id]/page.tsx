import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';

interface AuditProgramDetail {
  id: string;
  year: number;
  description: string | null;
  audits: {
    id: string;
    scheduled_at: string | null;
    auditor: string | null;
    scope: string | null;
  }[];
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default async function AuditProgramDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const auditProgram = await apiFetch<AuditProgramDetail>(`/sgq/audit-programs/${params.id}`);

  if (!auditProgram) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Programa de auditoria não encontrado.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link
        href="/sgq/audit-programs"
        className="mb-4 inline-block text-sm text-slate-600 hover:underline"
      >
        ← Voltar para SGQ — Programas de Auditoria
      </Link>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          Programa de Auditoria {auditProgram.year}
        </h1>
        <Link
          href={`/sgq/audit-programs/${auditProgram.id}/edit`}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Editar
        </Link>
      </div>
      <p className="mb-6 text-sm text-slate-500">{auditProgram.description ?? 'Sem descrição.'}</p>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Auditorias</h2>
          <Link
            href="/sgq/audits/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Novo Audit
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-4 py-2">Agendada para</th>
                <th className="px-4 py-2">Auditor</th>
                <th className="px-4 py-2">Escopo</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditProgram.audits.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Nenhuma auditoria cadastrada neste programa.
                  </td>
                </tr>
              )}
              {auditProgram.audits.map((audit) => (
                <tr key={audit.id}>
                  <td className="px-4 py-2">{formatDate(audit.scheduled_at)}</td>
                  <td className="px-4 py-2">{audit.auditor ?? '—'}</td>
                  <td className="px-4 py-2">{audit.scope ?? '—'}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/sgq/audits/${audit.id}`} className="text-slate-600 hover:underline">
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
