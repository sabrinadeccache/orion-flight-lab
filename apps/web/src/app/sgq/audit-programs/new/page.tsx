'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function NewAuditProgramPage(): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [year, setYear] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/sgq/audit-programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        year: Number(year),
        description: description || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível cadastrar o programa de auditoria.');
      return;
    }

    router.push('/sgq/audit-programs');
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link
        href="/sgq/audit-programs"
        className="mb-4 inline-block text-sm text-slate-600 hover:underline"
      >
        ← Voltar para SGQ — Programas de Auditoria
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Novo programa de auditoria</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Ano</label>
          <input
            required
            type="number"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Cadastrar programa'}
        </button>
      </form>
    </main>
  );
}
