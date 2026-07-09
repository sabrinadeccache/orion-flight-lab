import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';

interface Course {
  id: string;
  name: string;
}
interface StudentProgress {
  student: { id: string; full_name: string };
  enrollmentId: string;
  totalLessons: number;
  completedLessons: number;
  percent: number;
}

export default async function CourseProgressPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const [course, progress] = await Promise.all([
    apiFetch<Course>(`/training/courses/${params.id}`),
    apiFetch<StudentProgress[]>(`/lms/courses/${params.id}/progress`),
  ]);

  if (!course) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Curso não encontrado ou API indisponível.</p>
      </main>
    );
  }

  const rows = progress ?? [];

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/courses" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para Cursos
      </Link>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Progresso — {course.name}</h1>
        <Link
          href={`/courses/${course.id}/preview`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Visualizar como aluno
        </Link>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Percentual de lições concluídas por aluno matriculado (portal do aluno).
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Aluno</th>
              <th className="px-4 py-2">Lições concluídas</th>
              <th className="px-4 py-2">Progresso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Nenhum aluno matriculado neste curso.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.enrollmentId}>
                <td className="px-4 py-2">{row.student.full_name}</td>
                <td className="px-4 py-2">
                  {row.completedLessons} de {row.totalLessons}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{ width: `${row.percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{row.percent}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
