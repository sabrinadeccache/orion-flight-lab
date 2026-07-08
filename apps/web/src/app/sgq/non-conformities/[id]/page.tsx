import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { CloseNonConformityButton } from './close-button';
import { CompleteActionButton } from './complete-action-button';

interface NonConformityDetail {
  id: string;
  description: string;
  severity: string | null;
  status: string;
  canClose: boolean;
  audit: { id: string; scope: string | null };
  correctiveActions: {
    id: string;
    description: string;
    responsible: string | null;
    due_date: string | null;
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

export default async function NonConformityDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const nonConformity = await apiFetch<NonConformityDetail>(`/sgq/non-conformities/${params.id}`);

  if (!nonConformity) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Não conformidade não encontrada.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link
        href={`/sgq/audits/${nonConformity.audit.id}`}
        className="mb-4 inline-block text-sm text-slate-600 hover:underline"
      >
        ← Voltar para Auditoria
      </Link>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">{nonConformity.description}</h1>
      <p className="mb-6 text-sm text-slate-500">
        Severidade {severityLabel(nonConformity.severity)} · Status {nonConformity.status}
      </p>

      <div className="mb-8">
        <CloseNonConformityButton
          id={nonConformity.id}
          status={nonConformity.status}
          canClose={nonConformity.canClose}
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Ações Corretivas</h2>
          <Link
            href="/sgq/corrective-actions/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Nova Ação Corretiva
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2">Responsável</th>
                <th className="px-4 py-2">Prazo</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nonConformity.correctiveActions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Nenhuma ação corretiva registrada.
                  </td>
                </tr>
              )}
              {nonConformity.correctiveActions.map((action) => (
                <tr key={action.id}>
                  <td className="px-4 py-2">{action.description}</td>
                  <td className="px-4 py-2">{action.responsible ?? '—'}</td>
                  <td className="px-4 py-2">{action.due_date ?? '—'}</td>
                  <td className="px-4 py-2">{action.status}</td>
                  <td className="px-4 py-2">
                    {action.status === 'pendente' && <CompleteActionButton id={action.id} />}
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
