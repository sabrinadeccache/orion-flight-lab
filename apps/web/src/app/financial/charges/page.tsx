import Link from 'next/link';
import { apiFetch } from '../../../lib/api';

interface Charge {
  id: string;
  description: string | null;
  amount: string;
  due_date: string;
  status: string;
  client: { id: string; name: string } | null;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default async function ChargesPage(): Promise<React.ReactElement> {
  const charges = (await apiFetch<Charge[]>('/financial/charges')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Financeiro — Cobranças</h1>
        <Link
          href="/financial/charges/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Nova cobrança
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Descrição</th>
              <th className="px-4 py-2">Valor</th>
              <th className="px-4 py-2">Vencimento</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {charges.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma cobrança cadastrada.
                </td>
              </tr>
            )}
            {charges.map((charge) => (
              <tr key={charge.id}>
                <td className="px-4 py-2">{charge.client?.name ?? '—'}</td>
                <td className="px-4 py-2">{charge.description ?? '—'}</td>
                <td className="px-4 py-2">{charge.amount}</td>
                <td className="px-4 py-2">{formatDate(charge.due_date)}</td>
                <td className="px-4 py-2">{charge.status}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/financial/charges/${charge.id}`}
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
    </main>
  );
}
