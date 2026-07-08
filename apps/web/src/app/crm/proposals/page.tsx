import Link from 'next/link';
import { apiFetch } from '../../../lib/api';

interface Proposal {
  id: string;
  title: string;
  value: string;
  status: string;
  valid_until: string | null;
  client: { id: string; name: string } | null;
}

export default async function ProposalsPage(): Promise<React.ReactElement> {
  const proposals = (await apiFetch<Proposal[]>('/crm/proposals')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">CRM — Propostas</h1>
        <Link
          href="/crm/proposals/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Nova proposta
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Título</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Valor</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proposals.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma proposta cadastrada.
                </td>
              </tr>
            )}
            {proposals.map((proposal) => (
              <tr key={proposal.id}>
                <td className="px-4 py-2">{proposal.title}</td>
                <td className="px-4 py-2">{proposal.client?.name ?? '—'}</td>
                <td className="px-4 py-2">{proposal.value}</td>
                <td className="px-4 py-2">{proposal.status}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/crm/proposals/${proposal.id}`} className="text-slate-600 hover:underline">
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
