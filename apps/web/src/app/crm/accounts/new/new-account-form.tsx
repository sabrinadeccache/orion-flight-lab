'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ClientOption {
  id: string;
  name: string;
}

export function NewAccountForm({ clients }: { clients: ClientOption[] }): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState('ativo');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/crm/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ client_id: clientId, status }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível criar a conta.');
      return;
    }

    router.push('/crm/accounts');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
        <select
          required
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>
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
        {loading ? 'Salvando...' : 'Cadastrar conta'}
      </button>
    </form>
  );
}
