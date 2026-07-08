'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Account {
  id: string;
  status: string;
  client: { id: string; name: string } | null;
}

export default function EditAccountPage({ params }: { params: { id: string } }): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [status, setStatus] = useState('ativo');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`${API_URL}/crm/accounts/${params.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { data: Account } | null) => {
        if (!body) return;
        setAccount(body.data);
        setStatus(body.data.status);
      });
  }, [session, params.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/crm/accounts/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ status }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível salvar as alterações.');
      return;
    }

    router.push(`/crm/accounts/${params.id}`);
    router.refresh();
  }

  if (!account) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <p className="text-slate-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link
        href={`/crm/accounts/${params.id}`}
        className="mb-4 inline-block text-sm text-slate-600 hover:underline"
      >
        ← Voltar para Conta
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Editar conta</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">Cliente: {account.client?.name ?? '—'}</p>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ativo">Ativa</option>
            <option value="inativo">Inativa</option>
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
