import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';

interface AuditDetail {
  id: string;
  scheduled_at: string | null;
  auditor: string | null;
  scope: string | null;
  auditProgram: { id: string; year: number };
  nonConformities: {
    id: string;
    description: string;
    severity: string | null;
    status: string;
  }[];
}

const SEVERITY_LABELS: Record<string, string> = {
  menor: 'Menor',
  maior: 'Maior',
  critica: 'Crítica',
};

function severityLabel(severity: string | null): string {
  if (!severity) return '—';
  return SEVERITY_LABELS[severity] ?? severity;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default async function AuditDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const audit = await apiFetch<AuditDetail>(`/sgq/audits/${params.id}`);

  if (!audit) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Auditoria não encontrada.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link
        href={`/sgq/audit-programs/${audit.auditProgram.id}`}
        className="mb-4 inline-block text-sm text-slate-600 hover:underline"
      >
        ← Voltar para Programa de Auditoria {audit.auditProgram.year}
      </Link>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Auditoria</h1>
        <Link
          href={`/sgq/audits/${audit.id}/edit`}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Editar
        </Link>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Agendada para {formatDate(audit.scheduled_at)} · Auditor {audit.auditor ?? '—'} · Escopo{' '}
        {audit.scope ?? '—'}
      </p>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Não Conformidades</h2>
          <Link
            href="/sgq/non-conformities/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Nova Não Conformidade
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2">Severidade</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {audit.nonConformities.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Nenhuma não conformidade registrada nesta auditoria.
                  </td>
                </tr>
              )}
              {audit.nonConformities.map((nonConformity) => (
                <tr key={nonConformity.id}>
                  <td className="px-4 py-2">{nonConformity.description}</td>
                  <td className="px-4 py-2">{severityLabel(nonConformity.severity)}</td>
                  <td className="px-4 py-2">{nonConformity.status}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/sgq/non-conformities/${nonConformity.id}`}
                      className="text-slate-600 hover:underline"
                    >
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
