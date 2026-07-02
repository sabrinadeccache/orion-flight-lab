'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function NewExamPage(): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [type, setType] = useState<'teorico' | 'pratico'>('teorico');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ type, enrollment_id: enrollmentId, exam_date: examDate }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? 'Não foi possível registrar o exame (RN-07: quarentena por fraude).');
      return;
    }

    router.push('/students');
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Registrar exame</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as 'teorico' | 'pratico')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="teorico">Teórico</option>
            <option value="pratico">Prático</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Matrícula (ID)</label>
          <input
            required
            value={enrollmentId}
            onChange={(event) => setEnrollmentId(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Data do exame</label>
          <input
            type="date"
            required
            value={examDate}
            onChange={(event) => setExamDate(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Registrar'}
        </button>
      </form>
    </main>
  );
}
