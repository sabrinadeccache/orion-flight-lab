'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface CurriculumOption {
  id: string;
  name: string;
  version: string;
}

export function NewCourseForm({ curricula }: { curricula: CurriculumOption[] }): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [curriculumId, setCurriculumId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [maxStudents, setMaxStudents] = useState('25');
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/training/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        curriculum_id: curriculumId,
        name,
        code,
        max_students: maxStudents ? Number(maxStudents) : undefined,
        start_date: startDate || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível criar o curso.');
      return;
    }

    router.push('/courses');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Currículo</label>
        <select
          required
          value={curriculumId}
          onChange={(event) => setCurriculumId(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {curricula.map((curriculum) => (
            <option key={curriculum.id} value={curriculum.id}>
              {curriculum.name} (v{curriculum.version})
            </option>
          ))}
        </select>
      </div>
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
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Data de início (opcional)
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Cadastrar curso'}
      </button>
    </form>
  );
}
