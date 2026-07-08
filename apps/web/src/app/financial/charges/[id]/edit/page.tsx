'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Charge {
  id: string;
  description: string | null;
  due_date: string;
  status: string;
  client: { id: string; name: string } | null;
}

function toDateInputValue(value: string): string {
  return value.slice(0, 10);
}

export default function EditChargePage({ params }: { params: { id: string } }): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [charge, setCharge] = useState<Charge | null>(null);
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('pendente');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`${API_URL}/financial/charges/${params.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { data: Charge } | null) => {
        if (!body) return;
        setCharge(body.data);
        setDescription(body.data.description ?? '');
        setDueDate(toDateInputValue(body.data.due_date));
        setStatus(body.data.status);
      });
  }, [session, params.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/financial/charges/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        description: description || undefined,
        due_date: dueDate,
        status,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível salvar as alterações.');
      return;
    }

    router.push(`/financial/charges/${params.id}`);
    router.refresh();
  }

  if (!charge) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <p className="text-slate-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link
        href={`/financial/charges/${params.id}`}
        className="mb-4 inline-block text-sm text-slate-600 hover:underline"
      >
        ← Voltar para Cobrança
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Editar cobrança</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">Cliente: {charge.client?.name ?? '—'}</p>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Descrição (opcional)
          </label>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Vencimento</label>
          <input
            required
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="pendente">Pendente</option>
            <option value="paga">Paga</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </main>
  );
}
