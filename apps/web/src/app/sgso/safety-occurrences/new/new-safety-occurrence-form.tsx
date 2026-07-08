'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const MANDATORY_HAZARD_SEVERITIES = ['alta', 'critica'];

const SEVERITY_OPTIONS = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

interface HazardOption {
  id: string;
  description: string;
}

export function NewSafetyOccurrenceForm({
  hazards,
}: {
  hazards: HazardOption[];
}): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [severity, setSeverity] = useState('');
  const [hazardId, setHazardId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hazardRequired = MANDATORY_HAZARD_SEVERITIES.includes(severity.trim().toLowerCase());

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/sgso/safety-occurrences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        description,
        occurred_at: occurredAt,
        severity: severity || undefined,
        hazard_id: hazardId || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível registrar a ocorrência.');
      return;
    }

    router.push('/sgso/safety-occurrences');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
        <input
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Ocorrida em</label>
        <input
          required
          type="date"
          value={occurredAt}
          onChange={(event) => setOccurredAt(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Severidade (opcional)
        </label>
        <select
          value={severity}
          onChange={(event) => setSeverity(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {SEVERITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Perigo vinculado {hazardRequired ? '' : '(opcional)'}
        </label>
        <select
          required={hazardRequired}
          value={hazardId}
          onChange={(event) => setHazardId(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {hazards.map((hazard) => (
            <option key={hazard.id} value={hazard.id}>
              {hazard.description}
            </option>
          ))}
        </select>
        {hazardRequired && (
          <p className="mt-1 text-xs text-slate-500">
            Obrigatório para severidade alta/crítica (RN-28).
          </p>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Registrar ocorrência'}
      </button>
    </form>
  );
}
