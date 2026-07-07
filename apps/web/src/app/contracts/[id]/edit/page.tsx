'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Contract {
  id: string;
  contract_number: string;
  start_date: string;
  end_date: string | null;
  status: string;
  value: string | null;
}

export default function EditContractPage({
  params,
}: {
  params: { id: string };
}): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractNumber, setContractNumber] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('ativo');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`${API_URL}/contracts/${params.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { data: Contract } | null) => {
        if (!body) return;
        setContract(body.data);
        setContractNumber(body.data.contract_number);
        setEndDate(body.data.end_date ? body.data.end_date.slice(0, 10) : '');
        setStatus(body.data.status);
        setValue(body.data.value ?? '');
      });
  }, [session, params.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/contracts/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        contract_number: contractNumber,
        end_date: endDate || undefined,
        status,
        value: value ? Number(value) : undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível salvar as alterações.');
      return;
    }

    router.push('/contracts');
    router.refresh();
  }

  async function handleDelete(): Promise<void> {
    if (!confirm('Excluir este contrato? Essa ação não pode ser desfeita.')) return;
    setLoading(true);

    const response = await fetch(`${API_URL}/contracts/${params.id}`, {
      method: 'DELETE',
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });

    setLoading(false);

    if (!response.ok) {
      setError('Não foi possível excluir o contrato.');
      return;
    }

    router.push('/contracts');
    router.refresh();
  }

  if (!contract) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <p className="text-slate-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Editar contrato</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Número do contrato</label>
          <input
            required
            value={contractNumber}
            onChange={(event) => setContractNumber(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Data de vencimento (opcional)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
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
            <option value="ativo">Ativo</option>
            <option value="suspenso">Suspenso</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Valor (opcional)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Excluir contrato
          </button>
        </div>
      </form>
    </main>
  );
}
