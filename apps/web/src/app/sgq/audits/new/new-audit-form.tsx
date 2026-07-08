'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface AuditProgramOption {
  id: string;
  year: number;
  description: string | null;
}

export function NewAuditForm({
  auditPrograms,
}: {
  auditPrograms: AuditProgramOption[];
}): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [auditProgramId, setAuditProgramId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [auditor, setAuditor] = useState('');
  const [scope, setScope] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/sgq/audits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        audit_program_id: auditProgramId,
        scheduled_at: scheduledAt || undefined,
        auditor: auditor || undefined,
        scope: scope || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível criar a auditoria.');
      return;
    }

    router.push(`/sgq/audit-programs/${auditProgramId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Programa de auditoria</label>
        <select
          required
          value={auditProgramId}
          onChange={(event) => setAuditProgramId(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {auditPrograms.map((auditProgram) => (
            <option key={auditProgram.id} value={auditProgram.id}>
              {auditProgram.year}
              {auditProgram.description ? ` — ${auditProgram.description}` : ''}
            </option>
          ))}
        </select>
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
        {loading ? 'Salvando...' : 'Cadastrar auditoria'}
      </button>
    </form>
  );
}
