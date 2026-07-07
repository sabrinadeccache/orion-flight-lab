'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function NewExaminerPage(): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [anacAccreditation, setAnacAccreditation] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/personnel/examiners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        full_name: fullName,
        cpf,
        anac_accreditation: anacAccreditation || undefined,
        active,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível cadastrar o examinador.');
      return;
    }

    router.push('/personnel');
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/personnel" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para Pessoal
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Novo examinador</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nome completo</label>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">CPF</label>
          <input
            required
            value={cpf}
            onChange={(event) => setCpf(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Credenciamento ANAC (opcional)
          </label>
          <input
            value={anacAccreditation}
            onChange={(event) => setAnacAccreditation(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          Examinador ativo
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Cadastrar examinador'}
        </button>
      </form>
    </main>
  );
}
