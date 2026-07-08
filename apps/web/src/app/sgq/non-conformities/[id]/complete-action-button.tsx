'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function CompleteActionButton({ id }: { id: string }): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleComplete(): Promise<void> {
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/sgq/corrective-actions/${id}/complete`, {
      method: 'PATCH',
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível concluir a ação corretiva.');
      return;
    }

    router.refresh();
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleComplete}
        disabled={loading}
        className="text-slate-600 hover:underline disabled:opacity-50"
      >
        {loading ? 'Concluindo...' : 'Concluir'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
