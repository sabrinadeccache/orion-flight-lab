'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function CloseNonConformityButton({
  id,
  status,
  canClose,
}: {
  id: string;
  status: string;
  canClose: boolean;
}): React.ReactElement | null {
  const { session } = useSupabase();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === 'fechada') {
    return null;
  }

  async function handleClose(): Promise<void> {
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/sgq/non-conformities/${id}/close`, {
      method: 'PATCH',
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível fechar a não conformidade.');
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClose}
        disabled={!canClose || loading}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Fechando...' : 'Fechar não conformidade'}
      </button>
      {!canClose && (
        <p className="mt-2 text-sm text-slate-500">
          Só é possível fechar depois de concluir ao menos uma ação corretiva (RN-25).
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
