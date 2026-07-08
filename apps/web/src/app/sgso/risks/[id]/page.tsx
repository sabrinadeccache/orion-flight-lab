import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { RiskStatusActions } from './status-actions';

interface RiskDetail {
  id: string;
  probability: number;
  severity: number;
  risk_level: string | null;
  status: string;
  isHighRisk: boolean;
  canChangeStatus: boolean;
  hazard: { id: string; description: string };
  mitigations: {
    id: string;
    description: string;
    responsible: string | null;
  }[];
}

export default async function RiskDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const risk = await apiFetch<RiskDetail>(`/sgso/risks/${params.id}`);

  if (!risk) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Risco não encontrado.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link
        href={`/sgso/hazards/${risk.hazard.id}`}
        className="mb-4 inline-block text-sm text-slate-600 hover:underline"
      >
        ← Voltar para Perigo: {risk.hazard.description}
      </Link>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          Risco {risk.risk_level ?? risk.probability * risk.severity}
          {risk.isHighRisk ? ' (alto)' : ''}
        </h1>
        <Link
          href={`/sgso/risks/${risk.id}/edit`}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Editar
        </Link>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Probabilidade {risk.probability} · Severidade {risk.severity}
      </p>

      <div className="mb-8">
        <RiskStatusActions id={risk.id} status={risk.status} canChangeStatus={risk.canChangeStatus} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Mitigações</h2>
          <Link
            href="/sgso/mitigations/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Nova Mitigação
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {risk.mitigations.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-slate-400">
                    Nenhuma mitigação registrada para este risco.
                  </td>
                </tr>
              )}
              {risk.mitigations.map((mitigation) => (
                <tr key={mitigation.id}>
                  <td className="px-4 py-2">{mitigation.description}</td>
                  <td className="px-4 py-2">{mitigation.responsible ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
