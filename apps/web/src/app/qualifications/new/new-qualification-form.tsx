'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface StudentOption {
  id: string;
  full_name: string;
}

interface CourseOption {
  id: string;
  name: string;
  code: string;
}

export function NewQualificationForm({
  students,
  courses,
}: {
  students: StudentOption[];
  courses: CourseOption[];
}): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [qualificationCode, setQualificationCode] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/qualifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        student_id: studentId,
        course_id: courseId || undefined,
        qualification_code: qualificationCode,
        issued_at: issuedAt,
        expires_at: expiresAt || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível registrar a qualificação.');
      return;
    }

    router.push('/qualifications');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Aluno</label>
        <select
          required
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.full_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Curso de origem (opcional — curso prático que gerou esta habilitação)
        </label>
        <select
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Nenhum</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.code})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Código da qualificação
        </label>
        <input
          required
          value={qualificationCode}
          onChange={(event) => setQualificationCode(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Data de emissão</label>
        <input
          required
          type="date"
          value={issuedAt}
          onChange={(event) => setIssuedAt(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Data de vencimento (opcional)
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Registrar qualificação'}
      </button>
    </form>
  );
}
