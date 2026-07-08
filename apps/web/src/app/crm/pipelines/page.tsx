import Link from 'next/link';
import { apiFetch } from '../../../lib/api';

interface Pipeline {
  id: string;
  name: string;
  stage: string;
  expected_close_date: string | null;
}

export default async function PipelinesPage(): Promise<React.ReactElement> {
  const pipelines = (await apiFetch<Pipeline[]>('/crm/pipelines')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">CRM — Pipelines</h1>
        <Link
          href="/crm/pipelines/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Novo pipeline
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Estágio</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pipelines.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Nenhum pipeline cadastrado.
                </td>
              </tr>
            )}
            {pipelines.map((pipeline) => (
              <tr key={pipeline.id}>
                <td className="px-4 py-2">{pipeline.name}</td>
                <td className="px-4 py-2">{pipeline.stage}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/crm/pipelines/${pipeline.id}`} className="text-slate-600 hover:underline">
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
