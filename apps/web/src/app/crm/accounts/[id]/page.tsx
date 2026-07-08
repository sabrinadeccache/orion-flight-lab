import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';

interface AccountDetail {
  id: string;
  status: string;
  client: { id: string; name: string } | null;
  proposals: {
    id: string;
    title: string;
    value: string;
    status: string;
  }[];
}

export default async function AccountDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const account = await apiFetch<AccountDetail>(`/crm/accounts/${params.id}`);

  if (!account) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Conta não encontrada.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/crm/accounts" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para CRM — Contas
      </Link>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Conta — {account.client?.name ?? '—'}</h1>
        <Link
          href={`/crm/accounts/${account.id}/edit`}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Editar
        </Link>
      </div>
      <p className="mb-6 text-sm text-slate-500">Status: {account.status}</p>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Propostas</h2>
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
                <th className="px-4 py-2">Valor</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {account.proposals.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Nenhuma proposta vinculada a esta conta.
                  </td>
                </tr>
              )}
              {account.proposals.map((proposal) => (
                <tr key={proposal.id}>
                  <td className="px-4 py-2">{proposal.title}</td>
                  <td className="px-4 py-2">{proposal.value}</td>
                  <td className="px-4 py-2">{proposal.status}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/crm/proposals/${proposal.id}`}
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
