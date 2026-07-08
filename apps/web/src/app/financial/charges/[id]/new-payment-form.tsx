'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function NewPaymentForm({
  chargeId,
  remaining,
}: {
  chargeId: string;
  remaining: number;
}): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/financial/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        charge_id: chargeId,
        amount: Number(amount),
        method: method || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível registrar o pagamento.');
      return;
    }

    setAmount('');
    setMethod('');
    router.refresh();
  }

  if (remaining <= 0) {
    return <p className="text-sm text-slate-500">Cobrança quitada — nenhum saldo restante.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Valor</label>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          max={remaining}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Método (opcional)
        </label>
        <input
          value={method}
          onChange={(event) => setMethod(event.target.value)}
          className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Registrar pagamento'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
