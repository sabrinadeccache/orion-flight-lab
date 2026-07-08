import Link from 'next/link';
import { apiFetch } from '../../../lib/api';

interface Delinquency {
  id: string;
  days_overdue: number;
  status: string;
  notified_at: string | null;
  charge: {
    id: string;
    description: string | null;
    amount: string;
    due_date: string;
  };
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default async function DelinquenciesPage(): Promise<React.ReactElement> {
  const delinquencies = (await apiFetch<Delinquency[]>('/financial/delinquencies')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Financeiro — Inadimplência</h1>
      <p className="mb-6 text-sm text-slate-500">
        Gerada automaticamente pelo job diário (RN-32) a partir de cobranças vencidas e ainda
        pendentes — sem cadastro manual.
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Cobrança</th>
              <th className="px-4 py-2">Vencimento</th>
              <th className="px-4 py-2">Dias em atraso</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Notificado em</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {delinquencies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma inadimplência registrada.
                </td>
              </tr>
            )}
            {delinquencies.map((delinquency) => (
              <tr key={delinquency.id}>
                <td className="px-4 py-2">{delinquency.charge.description ?? '—'}</td>
                <td className="px-4 py-2">{formatDate(delinquency.charge.due_date)}</td>
                <td className="px-4 py-2">{delinquency.days_overdue}</td>
                <td className="px-4 py-2">{delinquency.status}</td>
                <td className="px-4 py-2">{formatDate(delinquency.notified_at)}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/financial/charges/${delinquency.charge.id}`}
                    className="text-slate-600 hover:underline"
                  >
                    Ver cobrança
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
