'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ClientOption {
  id: string;
  name: string;
}

interface ContractOption {
  id: string;
  contract_number: string;
}

export function NewChargeForm({
  clients,
  contracts,
}: {
  clients: ClientOption[];
  contracts: ContractOption[];
}): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [clientId, setClientId] = useState('');
  const [contractId, setContractId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/financial/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        client_id: clientId,
        contract_id: contractId || undefined,
        description: description || undefined,
        amount: Number(amount),
        due_date: dueDate,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível criar a cobrança.');
      return;
    }

    router.push('/financial/charges');
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Contrato (opcional)</label>
        <select
          value={contractId}
          onChange={(event) => setContractId(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Nenhum</option>
          {contracts.map((contract) => (
            <option key={contract.id} value={contract.id}>
              {contract.contract_number}
            </option>
          ))}
        </select>
      </div>
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Valor</label>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Cadastrar cobrança'}
      </button>
    </form>
  );
}
