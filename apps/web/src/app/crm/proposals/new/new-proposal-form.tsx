'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ClientOption {
  id: string;
  name: string;
}

interface AccountOption {
  id: string;
  client: { id: string; name: string } | null;
}

export function NewProposalForm({
  clients,
  accounts,
}: {
  clients: ClientOption[];
  accounts: AccountOption[];
}): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [clientId, setClientId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/crm/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        client_id: clientId,
        account_id: accountId || undefined,
        title,
        value: Number(value),
        valid_until: validUntil || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível criar a proposta.');
      return;
    }

    router.push('/crm/proposals');
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Conta (opcional)</label>
        <select
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Nenhuma</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.client?.name ?? account.id}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Valor</label>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Válida até (opcional)
        </label>
        <input
          type="date"
          value={validUntil}
          onChange={(event) => setValidUntil(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Cadastrar proposta'}
      </button>
    </form>
  );
}
