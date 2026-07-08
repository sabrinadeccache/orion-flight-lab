'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface AuditOption {
  id: string;
  scheduled_at: string | null;
  scope: string | null;
}

const SEVERITY_OPTIONS = [
  { value: 'menor', label: 'Menor — não afeta a conformidade regulatória' },
  { value: 'maior', label: 'Maior — afeta processo do SGQ' },
  { value: 'critica', label: 'Crítica — afeta segurança operacional ou conformidade ANAC' },
];

export function NewNonConformityForm({ audits }: { audits: AuditOption[] }): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [auditId, setAuditId] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/sgq/non-conformities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        audit_id: auditId,
        description,
        severity: severity || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível registrar a não conformidade.');
      return;
    }

    router.push(`/sgq/audits/${auditId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Auditoria</label>
        <select
          required
          value={auditId}
          onChange={(event) => setAuditId(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {audits.map((audit) => (
            <option key={audit.id} value={audit.id}>
              {audit.scope ?? audit.scheduled_at ?? audit.id}
            </option>
          ))}
        </select>
      </div>
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Registrar não conformidade'}
      </button>
    </form>
  );
}
