import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { CourseCard } from '../../components/portal/course-card';
import { ProgressRing } from '../../components/portal/progress-ring';

interface EnrollmentSummary {
  id: string;
  status: string;
  course: { id: string; name: string; code: string; status: string };
  totalLessons: number;
  completedLessons: number;
}

function percentOf(enrollment: EnrollmentSummary): number {
  return enrollment.totalLessons > 0
    ? Math.round((enrollment.completedLessons / enrollment.totalLessons) * 100)
    : 0;
}

function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const hueA = hash % 360;
  const hueB = (hueA + 40 + (hash % 60)) % 360;
  return `linear-gradient(120deg, hsl(${hueA} 60% 12%), hsl(${hueB} 55% 18%))`;
}

export default async function PortalDashboardPage(): Promise<React.ReactElement> {
  const enrollments = (await apiFetch<EnrollmentSummary[]>('/lms/my-enrollments')) ?? [];
  const [featured, ...rest] = enrollments;

  return (
    <main className="mx-auto max-w-6xl px-8 py-10">
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-portal-muted">Portal do aluno</p>
      <h1 className="mb-8 font-display text-3xl font-bold text-portal-text">Meus cursos</h1>

      {featured && (
        <Link
          href={`/portal/enrollments/${featured.id}`}
          className="group mb-10 block overflow-hidden rounded-2xl border border-white/5"
          style={{ background: gradientFor(featured.course.code) }}
        >
          <div className="flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-portal-text/60">
                Continuar de onde parou
              </p>
              <h2 className="font-display text-2xl font-bold text-portal-text sm:text-3xl">
                {featured.course.name}
              </h2>
              <p className="mt-2 font-mono text-sm text-portal-text/70">
                {featured.completedLessons} de {featured.totalLessons} lições · {featured.course.code}
              </p>
              <span className="mt-4 inline-block rounded-full bg-portal-amber px-5 py-2 text-sm font-semibold text-portal-void group-hover:bg-portal-amber/90">
                Continuar curso
              </span>
            </div>
            <ProgressRing percent={percentOf(featured)} size={88} />
          </div>
        </Link>
      )}

      <h2 className="mb-4 font-display text-lg font-semibold text-portal-text">Todos os cursos</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((enrollment) => (
          <CourseCard
            key={enrollment.id}
            href={`/portal/enrollments/${enrollment.id}`}
            code={enrollment.course.code}
            name={enrollment.course.name}
            status={enrollment.status}
            percent={percentOf(enrollment)}
          />
        ))}
        {enrollments.length === 0 && (
          <p className="col-span-full text-sm text-portal-muted">Nenhuma matrícula encontrada.</p>
        )}
        {enrollments.length === 1 && (
          <p className="col-span-full text-sm text-portal-muted">
            Esse é o seu único curso por enquanto — acompanhe o progresso acima.
          </p>
        )}
      </div>
    </main>
  );
}
