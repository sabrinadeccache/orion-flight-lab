'use client';

import { useState } from 'react';
import { useSupabase } from '../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function DownloadCertificateButton({ id }: { id: string }): React.ReactElement {
  const { session } = useSupabase();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(): Promise<void> {
    setDownloading(true);
    setError(null);

    // Opened synchronously inside the click handler so the browser still
    // attributes it to the user gesture — setting location after the signed
    // URL comes back from an `await` gets silently blocked by popup blockers.
    const downloadWindow = window.open('', '_blank', 'noopener,noreferrer');

    const response = await fetch(`${API_URL}/certificates/${id}/download`, {
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });

    setDownloading(false);

    if (!response.ok) {
      downloadWindow?.close();
      setError('Não foi possível gerar o link de download.');
      return;
    }

    const body: { data: { url: string } | null } = await response.json();
    if (!body.data) {
      downloadWindow?.close();
      setError('Nenhum arquivo disponível para este certificado.');
      return;
    }

    if (downloadWindow) {
      downloadWindow.location.href = body.data.url;
    } else {
      window.location.href = body.data.url;
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {downloading ? 'Gerando link...' : 'Baixar certificado'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
