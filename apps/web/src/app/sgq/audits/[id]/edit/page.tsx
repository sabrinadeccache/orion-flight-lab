'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Audit {
  id: string;
  scheduled_at: string | null;
  auditor: string | null;
  scope: string | null;
  auditProgram: { id: string; year: number };
}

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

export default function EditAuditPage({ params }: { params: { id: string } }): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [auditor, setAuditor] = useState('');
  const [scope, setScope] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`${API_URL}/sgq/audits/${params.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { data: Audit } | null) => {
        if (!body) return;
        setAudit(body.data);
        setScheduledAt(toDateInputValue(body.data.scheduled_at));
        setAuditor(body.data.auditor ?? '');
        setScope(body.data.scope ?? '');
      });
  }, [session, params.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/sgq/audits/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        scheduled_at: scheduledAt || undefined,
        auditor: auditor || undefined,
        scope: scope || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível salvar as alterações.');
      return;
    }

    router.push(`/sgq/audits/${params.id}`);
    router.refresh();
  }

  if (!audit) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <p className="text-slate-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link
        href={`/sgq/audits/${params.id}`}
        className="mb-4 inline-block text-sm text-slate-600 hover:underline"
      >
        ← Voltar para Auditoria
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Editar auditoria</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Programa de auditoria
          </label>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            {audit.auditProgram.year} (não pode ser alterado)
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Agendada para (opcional)
          </label>
          <input
            type="date"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Auditor (opcional)</label>
          <input
            value={auditor}
            onChange={(event) => setAuditor(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Escopo (opcional)</label>
          <input
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
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
