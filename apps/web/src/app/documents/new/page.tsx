'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function NewDocumentPage(): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('EM_ELABORACAO');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/documents`, {
      method: 'POST',
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

    if (!response.ok) {
      setLoading(false);
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível cadastrar o documento.');
      return;
    }

    const body: { data: { id: string } } = await response.json();

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`${API_URL}/documents/${body.data.id}/versions`, {
        method: 'POST',
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: formData,
      });

      setLoading(false);

      if (!uploadResponse.ok) {
        const uploadBody = await uploadResponse.json().catch(() => null);
        setError(
          uploadBody?.errors?.[0]?.message ??
            'Documento cadastrado, mas não foi possível enviar o arquivo. Tente novamente na tela de edição.',
        );
        router.push(`/documents/${body.data.id}/edit`);
        router.refresh();
        return;
      }
    }

    setLoading(false);
    router.push('/documents');
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/documents" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para Documentos
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Novo documento</h1>
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
          {file && (
            <p className="mt-1 text-xs text-amber-700">
              Enviando um arquivo agora, o status final fica "Em revisão" — toda nova versão
              reabre a revisão, independente do que for escolhido aqui.
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Arquivo (opcional)
          </label>
          <input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-700"
          />
          <p className="mt-1 text-xs text-slate-500">
            Se enviado agora, vira a versão 1 do documento. Dá pra enviar depois também, na tela
            de edição.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Cadastrar documento'}
        </button>
      </form>
    </main>
  );
}
