'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

interface Risk {
  id: string;
  probability: number;
  severity: number;
  status: string;
  hazard: { id: string; description: string };
}

export default function EditRiskPage({ params }: { params: { id: string } }): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [risk, setRisk] = useState<Risk | null>(null);
  const [probability, setProbability] = useState('1');
  const [severity, setSeverity] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`${API_URL}/sgso/risks/${params.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { data: Risk } | null) => {
        if (!body) return;
        setRisk(body.data);
        setProbability(String(body.data.probability));
        setSeverity(String(body.data.severity));
      });
  }, [session, params.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/sgso/risks/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        probability: Number(probability),
        severity: Number(severity),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível salvar as alterações.');
      return;
    }

    router.push(`/sgso/risks/${params.id}`);
    router.refresh();
  }

  if (!risk) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <p className="text-slate-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link
        href={`/sgso/risks/${params.id}`}
        className="mb-4 inline-block text-sm text-slate-600 hover:underline"
      >
        ← Voltar para Risco
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Editar risco</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Perigo</label>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            {risk.hazard.description} (não pode ser alterado)
          </p>
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
          {loading ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </main>
  );
}
