'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface DocumentRecord {
  id: string;
  title: string;
  category: string | null;
  status: string;
}

interface DocumentVersion {
  version_number: number;
}

export default function EditDocumentPage({
  params,
}: {
  params: { id: string };
}): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [documentRecord, setDocumentRecord] = useState<DocumentRecord | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('EM_ELABORACAO');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [latestVersion, setLatestVersion] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  function loadVersions(): void {
    if (!session) return;
    fetch(`${API_URL}/documents/${params.id}/versions`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { data: DocumentVersion[] } | null) => {
        const versions = body?.data ?? [];
        setLatestVersion(versions.length > 0 ? versions[versions.length - 1].version_number : null);
      });
  }

  useEffect(() => {
    if (!session) return;
    fetch(`${API_URL}/documents/${params.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { data: DocumentRecord } | null) => {
        if (!body) return;
        setDocumentRecord(body.data);
        setTitle(body.data.title);
        setCategory(body.data.category ?? '');
        setStatus(body.data.status);
      });
    loadVersions();
  }, [session, params.id]);

  async function handleUpload(): Promise<void> {
    if (!file) return;
    setUploading(true);
    setFileError(null);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/documents/${params.id}/versions`, {
      method: 'POST',
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      body: formData,
    });

    setUploading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setFileError(body?.errors?.[0]?.message ?? 'Não foi possível enviar o arquivo.');
      return;
    }

    setFile(null);
    loadVersions();
  }

  async function handleDownload(): Promise<void> {
    setDownloading(true);
    setFileError(null);

    // Open the tab synchronously, inside the click handler, so the browser
    // still attributes it to the user gesture — setting its location after
    // the signed URL comes back from an `await` (as this used to do) makes
    // popup blockers treat it as an unsolicited popup and silently block it,
    // which is why the download felt stuck/intermittent.
    const downloadWindow = window.open('', '_blank', 'noopener,noreferrer');

    const response = await fetch(`${API_URL}/documents/${params.id}/download`, {
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });

    setDownloading(false);

    if (!response.ok) {
      downloadWindow?.close();
      setFileError('Não foi possível gerar o link de download.');
      return;
    }

    const body: { data: { url: string } | null } = await response.json();
    if (!body.data) {
      downloadWindow?.close();
      setFileError('Nenhum arquivo enviado ainda para este documento.');
      return;
    }

    if (downloadWindow) {
      downloadWindow.location.href = body.data.url;
    } else {
      // Popup blocked even for the synchronous open (e.g. browser setting) —
      // fall back to a same-tab navigation, which is never blocked.
      window.location.href = body.data.url;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/documents/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        title,
        category: category || undefined,
        status,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível salvar as alterações.');
      return;
    }

    router.push('/documents');
    router.refresh();
  }

  async function handleDelete(): Promise<void> {
    if (!confirm('Excluir este documento? Essa ação não pode ser desfeita.')) return;
    setLoading(true);

    const response = await fetch(`${API_URL}/documents/${params.id}`, {
      method: 'DELETE',
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });

    setLoading(false);

    if (!response.ok) {
      setError('Não foi possível excluir o documento.');
      return;
    }

    router.push('/documents');
    router.refresh();
  }

  if (!documentRecord) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <p className="text-slate-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/documents" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para Documentos
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Editar documento</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Categoria (opcional)
          </label>
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="EM_ELABORACAO">Em elaboração</option>
            <option value="SUBMETIDO_ANAC">Submetido à ANAC</option>
            <option value="APROVADO">Aprovado</option>
            <option value="EM_REVISAO">Em revisão</option>
            <option value="EMENDADO">Emendado</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Excluir documento
          </button>
        </div>
      </form>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-medium text-slate-900">Arquivo</h2>
        <p className="mb-3 text-xs text-slate-500">
          {latestVersion !== null
            ? `Versão atual: v${latestVersion}`
            : 'Nenhum arquivo enviado ainda.'}
        </p>
        <div className="mb-3 flex items-center gap-3">
          <input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="text-sm text-slate-700"
          />
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {uploading ? 'Enviando...' : 'Enviar nova versão'}
          </button>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {downloading ? 'Gerando link...' : 'Baixar documento'}
        </button>
        {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
      </div>
    </main>
  );
}
