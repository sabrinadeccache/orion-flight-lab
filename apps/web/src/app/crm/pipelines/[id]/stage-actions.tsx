'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const STAGE_OPTIONS = [
  { value: 'prospeccao', label: 'Prospecção' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'ganho', label: 'Ganho' },
  { value: 'perdido', label: 'Perdido' },
];

export function PipelineStageActions({ id, stage }: { id: string; stage: string }): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [selected, setSelected] = useState(stage);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/crm/pipelines/${id}/stage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ stage: selected }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível atualizar o estágio do pipeline.');
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Estágio</label>
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {STAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading || selected === stage}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Atualizar estágio'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
