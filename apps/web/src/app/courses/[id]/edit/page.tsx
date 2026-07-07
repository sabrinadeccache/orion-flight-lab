'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Course {
  id: string;
  name: string;
  code: string;
  modality: string;
  status: string;
  max_students: number;
}

export default function EditCoursePage({ params }: { params: { id: string } }): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [modality, setModality] = useState('MISTO');
  const [maxStudents, setMaxStudents] = useState('25');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`${API_URL}/training/courses/${params.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { data: Course } | null) => {
        if (!body) return;
        setCourse(body.data);
        setName(body.data.name);
        setCode(body.data.code);
        setModality(body.data.modality);
        setMaxStudents(String(body.data.max_students));
      });
  }, [session, params.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/training/courses/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        name,
        code,
        modality,
        max_students: maxStudents ? Number(maxStudents) : undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível salvar as alterações.');
      return;
    }

    router.push('/courses');
    router.refresh();
  }

  async function handleDelete(): Promise<void> {
    if (!confirm('Excluir este curso? Essa ação não pode ser desfeita.')) return;
    setLoading(true);

    const response = await fetch(`${API_URL}/training/courses/${params.id}`, {
      method: 'DELETE',
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });

    setLoading(false);

    if (!response.ok) {
      setError('Não foi possível excluir o curso.');
      return;
    }

    router.push('/courses');
    router.refresh();
  }

  if (!course) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <p className="text-slate-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/courses" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para Cursos
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Editar curso</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nome do curso</label>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Código</label>
          <input
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Modalidade</label>
          <select
            value={modality}
            onChange={(event) => setModality(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="TEORICO">Teórico (certificado emite qualificação automaticamente)</option>
            <option value="PRATICO">Prático (qualificação inserida manualmente)</option>
            <option value="MISTO">Misto (exige teoria e prática, sem qualificação automática)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Limite de alunos (RN-11: máx. 25)
          </label>
          <input
            type="number"
            min={1}
            max={25}
            value={maxStudents}
            onChange={(event) => setMaxStudents(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
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
            Excluir curso
          </button>
        </div>
      </form>
    </main>
  );
}
