import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';

interface HazardDetail {
  id: string;
  description: string;
  source: string | null;
  risks: {
    id: string;
    probability: number;
    severity: number;
    risk_level: string | null;
    status: string;
  }[];
}

export default async function HazardDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const hazard = await apiFetch<HazardDetail>(`/sgso/hazards/${params.id}`);

  if (!hazard) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Perigo não encontrado.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/sgso/hazards" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para SGSO — Perigos
      </Link>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{hazard.description}</h1>
        <Link
          href={`/sgso/hazards/${hazard.id}/edit`}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Editar
        </Link>
      </div>
      <p className="mb-6 text-sm text-slate-500">Fonte: {hazard.source ?? '—'}</p>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Riscos</h2>
          <Link
            href="/sgso/risks/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Novo Risco
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-4 py-2">Probabilidade</th>
                <th className="px-4 py-2">Severidade</th>
                <th className="px-4 py-2">Nível de risco</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hazard.risks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Nenhum risco registrado para este perigo.
                  </td>
                </tr>
              )}
              {hazard.risks.map((risk) => (
                <tr key={risk.id}>
                  <td className="px-4 py-2">{risk.probability}</td>
                  <td className="px-4 py-2">{risk.severity}</td>
                  <td className="px-4 py-2">{risk.risk_level ?? '—'}</td>
                  <td className="px-4 py-2">{risk.status}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/sgso/risks/${risk.id}`} className="text-slate-600 hover:underline">
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
