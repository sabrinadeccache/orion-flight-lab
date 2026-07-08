import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { NewPaymentForm } from './new-payment-form';

interface ChargeDetail {
  id: string;
  description: string | null;
  amount: string;
  due_date: string;
  status: string;
  client: { id: string; name: string } | null;
  payments: {
    id: string;
    amount: string;
    paid_at: string;
    method: string | null;
  }[];
  totalPaid: number;
  remaining: number;
  isFullyPaid: boolean;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default async function ChargeDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const charge = await apiFetch<ChargeDetail>(`/financial/charges/${params.id}`);

  if (!charge) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Cobrança não encontrada.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link
        href="/financial/charges"
        className="mb-4 inline-block text-sm text-slate-600 hover:underline"
      >
        ← Voltar para Financeiro — Cobranças
      </Link>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          Cobrança — {charge.client?.name ?? '—'}
        </h1>
        <Link
          href={`/financial/charges/${charge.id}/edit`}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Editar
        </Link>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        {charge.description ?? 'Sem descrição.'} · Valor: {charge.amount} · Vencimento:{' '}
        {formatDate(charge.due_date)} · Status: {charge.status} · Pago: {charge.totalPaid} · Restante:{' '}
        {charge.remaining}
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Registrar pagamento</h2>
        <NewPaymentForm chargeId={charge.id} remaining={charge.remaining} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-900">Pagamentos</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Valor</th>
                <th className="px-4 py-2">Método</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {charge.payments.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    Nenhum pagamento registrado.
                  </td>
                </tr>
              )}
              {charge.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-2">{formatDate(payment.paid_at)}</td>
                  <td className="px-4 py-2">{payment.amount}</td>
                  <td className="px-4 py-2">{payment.method ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
