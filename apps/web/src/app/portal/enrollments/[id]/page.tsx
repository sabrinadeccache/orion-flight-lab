import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';

interface LessonNode {
  id: string;
  name: string;
  order: number;
  hasQuiz: boolean;
  progressStatus: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
}
interface SubUnitNode {
  id: string;
  name: string;
  lessons: LessonNode[];
}
interface UnitNode {
  id: string;
  name: string;
  subUnits: SubUnitNode[];
}
interface ModuleNode {
  id: string;
  name: string;
  units: UnitNode[];
}
interface SegmentNode {
  id: string;
  name: string;
  modules: ModuleNode[];
}
interface EnrollmentContent {
  enrollment: { id: string; status: string };
  course: { name: string };
  segments: SegmentNode[];
}

const STATUS_ICON: Record<LessonNode['progressStatus'], string> = {
  NAO_INICIADO: '○',
  EM_ANDAMENTO: '◐',
  CONCLUIDO: '●',
};

export default async function PortalEnrollmentContentPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const content = await apiFetch<EnrollmentContent>(`/lms/enrollments/${params.id}/content`);

  if (!content) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Matrícula não encontrada.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/portal" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para Meus cursos
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">{content.course.name}</h1>

      <div className="space-y-4">
        {content.segments.map((segment) => (
          <div key={segment.id}>
            <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">{segment.name}</h2>
            {segment.modules.map((moduleItem) => (
              <div key={moduleItem.id} className="mb-3 pl-2">
                <h3 className="mb-1 text-sm font-medium text-slate-700">{moduleItem.name}</h3>
                {moduleItem.units.map((unit) => (
                  <div key={unit.id} className="mb-2 pl-3">
                    {unit.subUnits.map((subUnit) => (
                      <div key={subUnit.id} className="mb-2 pl-3">
                        <p className="mb-1 text-xs font-medium text-slate-500">{subUnit.name}</p>
                        <ul className="space-y-1 pl-3">
                          {subUnit.lessons.map((lesson) => (
                            <li key={lesson.id}>
                              <Link
                                href={`/portal/lessons/${lesson.id}`}
                                className="flex items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
                              >
                                <span
                                  className={
                                    lesson.progressStatus === 'CONCLUIDO'
                                      ? 'text-emerald-600'
                                      : 'text-slate-400'
                                  }
                                >
                                  {STATUS_ICON[lesson.progressStatus]}
                                </span>
                                {lesson.name}
                                {lesson.hasQuiz && (
                                  <span className="text-xs text-slate-400">(com quiz)</span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
        {content.segments.length === 0 && (
          <p className="text-sm text-slate-400">Este curso ainda não tem conteúdo publicado.</p>
        )}
      </div>
    </main>
  );
}
