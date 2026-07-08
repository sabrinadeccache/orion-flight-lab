'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ProposalOption {
  id: string;
  title: string;
}

export function NewPipelineForm({ proposals }: { proposals: ProposalOption[] }): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [name, setName] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/crm/pipelines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        name,
        proposal_id: proposalId || undefined,
        expected_close_date: expectedCloseDate || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível criar o pipeline.');
      return;
    }

    router.push('/crm/pipelines');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Proposta (opcional)</label>
        <select
          value={proposalId}
          onChange={(event) => setProposalId(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Nenhuma</option>
          {proposals.map((proposal) => (
            <option key={proposal.id} value={proposal.id}>
              {proposal.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Previsão de fechamento (opcional)
        </label>
        <input
          type="date"
          value={expectedCloseDate}
          onChange={(event) => setExpectedCloseDate(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Cadastrar pipeline'}
      </button>
    </form>
  );
}
