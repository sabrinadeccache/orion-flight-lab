import Link from 'next/link';
import { apiFetch } from '../../../lib/api';

interface Account {
  id: string;
  status: string;
  client: { id: string; name: string } | null;
}

export default async function AccountsPage(): Promise<React.ReactElement> {
  const accounts = (await apiFetch<Account[]>('/crm/accounts')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">CRM — Contas</h1>
        <Link
          href="/crm/accounts/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Nova conta
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma conta cadastrada.
                </td>
              </tr>
            )}
            {accounts.map((account) => (
              <tr key={account.id}>
                <td className="px-4 py-2">{account.client?.name ?? '—'}</td>
                <td className="px-4 py-2">{account.status}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/crm/accounts/${account.id}`} className="text-slate-600 hover:underline">
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
