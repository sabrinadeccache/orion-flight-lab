'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function RiskStatusActions({
  id,
  status,
  canChangeStatus,
}: {
  id: string;
  status: string;
  canChangeStatus: boolean;
}): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleChangeStatus(newStatus: 'aceito' | 'mitigado'): Promise<void> {
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/sgso/risks/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ status: newStatus }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível atualizar o status do risco.');
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">Status: {status}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleChangeStatus('aceito')}
          disabled={!canChangeStatus || loading || status === 'aceito'}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Marcar como aceito
        </button>
        <button
          type="button"
          onClick={() => handleChangeStatus('mitigado')}
          disabled={!canChangeStatus || loading || status === 'mitigado'}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50"
        >
          Marcar como mitigado
        </button>
      </div>
      {!canChangeStatus && (
        <p className="mt-2 text-sm text-slate-500">
          Risco de nível alto: é preciso registrar ao menos uma mitigação antes de aceitar ou
          mitigar (RN-27).
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
