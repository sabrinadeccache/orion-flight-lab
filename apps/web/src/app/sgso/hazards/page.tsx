import Link from 'next/link';
import { apiFetch } from '../../../lib/api';

interface Hazard {
  id: string;
  description: string;
  source: string | null;
}

export default async function HazardsPage(): Promise<React.ReactElement> {
  const hazards = (await apiFetch<Hazard[]>('/sgso/hazards')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">SGSO — Perigos</h1>
        <Link
          href="/sgso/hazards/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Novo perigo
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Descrição</th>
              <th className="px-4 py-2">Fonte</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {hazards.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Nenhum perigo cadastrado.
                </td>
              </tr>
            )}
            {hazards.map((hazard) => (
              <tr key={hazard.id}>
                <td className="px-4 py-2">{hazard.description}</td>
                <td className="px-4 py-2">{hazard.source ?? '—'}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/sgso/hazards/${hazard.id}`} className="text-slate-600 hover:underline">
                    Ver detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
