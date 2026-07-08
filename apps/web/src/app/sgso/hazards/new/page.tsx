'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const SOURCE_OPTIONS = [
  'Auditoria interna (SGQ)',
  'Relato voluntário',
  'Investigação de ocorrência',
  'Inspeção de rotina',
  'Análise de dados de voo',
  'Fiscalização ANAC',
];

export default function NewHazardPage(): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/sgso/hazards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        description,
        source: source || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível cadastrar o perigo.');
      return;
    }

    router.push('/sgso/hazards');
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/sgso/hazards" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para SGSO — Perigos
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Novo perigo</h1>
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
          <label className="mb-1 block text-sm font-medium text-slate-700">Fonte (opcional)</label>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            {SOURCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
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
          {loading ? 'Salvando...' : 'Cadastrar perigo'}
        </button>
      </form>
    </main>
  );
}
