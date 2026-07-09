'use client';

import { useSupabase } from '../../../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function DownloadButton({ materialId }: { materialId: string }): React.ReactElement {
  const { session } = useSupabase();
  const token = session?.access_token;

  async function handleDownload(): Promise<void> {
    // Open the tab synchronously (before any await) — a popup blocker will
    // silently swallow window.open() called after an awaited fetch.
    const tab = window.open('', '_blank');
    const response = await fetch(`${API_URL}/training/materials/${materialId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      tab?.close();
      return;
    }
    const body = await response.json();
    if (tab && body.data?.url) {
      tab.location.href = body.data.url;
    }
  }

  return (
    <button
      onClick={handleDownload}
      className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-portal-text hover:bg-white/5"
    >
      Abrir arquivo
    </button>
  );
}
