'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface HazardOption {
  id: string;
  description: string;
}

/** Matriz de risco 5x5 (ICAO Doc 9859) — referência padrão dos MGSOs de SGSO. */
const PROBABILITY_SCALE = [
  { value: 5, label: '5 — Frequente' },
  { value: 4, label: '4 — Ocasional' },
  { value: 3, label: '3 — Remota' },
  { value: 2, label: '2 — Improvável' },
  { value: 1, label: '1 — Extremamente improvável' },
];

const SEVERITY_SCALE = [
  { value: 5, label: '5 — Catastrófica' },
  { value: 4, label: '4 — Perigosa' },
  { value: 3, label: '3 — Maior' },
  { value: 2, label: '2 — Menor' },
  { value: 1, label: '1 — Insignificante' },
];

export function NewRiskForm({ hazards }: { hazards: HazardOption[] }): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [hazardId, setHazardId] = useState('');
  const [probability, setProbability] = useState('1');
  const [severity, setSeverity] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/sgso/risks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        hazard_id: hazardId,
        probability: Number(probability),
        severity: Number(severity),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível criar o risco.');
      return;
    }

    router.push(`/sgso/hazards/${hazardId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Perigo</label>
        <select
          required
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
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Probabilidade</label>
        <select
          value={probability}
          onChange={(event) => setProbability(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {PROBABILITY_SCALE.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Severidade</label>
        <select
          value={severity}
          onChange={(event) => setSeverity(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {SEVERITY_SCALE.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Cadastrar risco'}
      </button>
    </form>
  );
}
