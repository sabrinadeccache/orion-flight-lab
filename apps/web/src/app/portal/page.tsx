import Link from 'next/link';
import { apiFetch } from '../../lib/api';

interface EnrollmentSummary {
  id: string;
  status: string;
  course: { id: string; name: string; code: string; status: string };
  totalLessons: number;
  completedLessons: number;
}

export default async function PortalDashboardPage(): Promise<React.ReactElement> {
  const enrollments = (await apiFetch<EnrollmentSummary[]>('/lms/my-enrollments')) ?? [];

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Meus cursos</h1>
      <p className="mb-6 text-sm text-slate-500">Suas matrículas e o progresso em cada curso.</p>

      <div className="space-y-3">
        {enrollments.map((enrollment) => {
          const percent =
            enrollment.totalLessons > 0
              ? Math.round((enrollment.completedLessons / enrollment.totalLessons) * 100)
              : 0;
          return (
            <Link
              key={enrollment.id}
              href={`/portal/enrollments/${enrollment.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900">{enrollment.course.name}</p>
                <span className="text-xs text-slate-500">{enrollment.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {enrollment.completedLessons} de {enrollment.totalLessons} lições concluídas
              </p>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-900"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </Link>
          );
        })}
        {enrollments.length === 0 && (
          <p className="text-sm text-slate-400">Nenhuma matrícula encontrada.</p>
        )}
      </div>
    </main>
  );
}
