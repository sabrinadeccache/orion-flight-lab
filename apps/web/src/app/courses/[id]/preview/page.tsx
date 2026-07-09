import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';

interface LessonNode {
  id: string;
  name: string;
  order: number;
  hasQuiz: boolean;
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
interface CoursePreviewContent {
  course: { id: string; name: string; code: string };
  segments: SegmentNode[];
}

function lessonsOf(segment: SegmentNode): LessonNode[] {
  return segment.modules.flatMap((m) => m.units.flatMap((u) => u.subUnits.flatMap((s) => s.lessons)));
}

export default async function CoursePreviewPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const content = await apiFetch<CoursePreviewContent>(`/training/courses/${params.id}/preview-content`);

  if (!content) {
    return (
      <main className="mx-auto max-w-4xl px-8 py-10">
        <p className="text-portal-muted">Curso não encontrado.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-8 py-10">
      <Link
        href={`/courses/${params.id}/content`}
        className="mb-6 inline-block font-mono text-xs text-portal-muted hover:text-portal-amber"
      >
        ← Voltar para a gestão do curso
      </Link>
      <div className="mb-8 rounded-lg border border-portal-amber/20 bg-portal-amber/5 px-4 py-2 font-mono text-xs text-portal-amber">
        Modo de visualização — assim é o que o aluno vê. Sem progresso real, sem envio de quiz.
      </div>
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-portal-muted">
        {content.course.code}
      </p>
      <h1 className="mb-8 font-display text-2xl font-bold text-portal-text">{content.course.name}</h1>

      <div className="space-y-6">
        {content.segments.map((segment, segmentIndex) => {
          const lessons = lessonsOf(segment);
          return (
            <section key={segment.id} className="rounded-xl border border-white/5 bg-portal-panel p-5">
              <h2 className="mb-4 flex items-center gap-3 font-display text-base font-semibold text-portal-text">
                <span className="font-mono text-xs text-portal-muted">
                  Capítulo {String(segmentIndex + 1).padStart(2, '0')}
                </span>
                {segment.name}
              </h2>
              <ul className="space-y-1">
                {lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      href={`/courses/${params.id}/preview/lessons/${lesson.id}`}
                      className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 hover:bg-portal-panelHover"
                    >
                      <span className="flex items-center gap-2 text-sm text-portal-text">
                        {lesson.name}
                        {lesson.hasQuiz && (
                          <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-portal-muted">
                            quiz
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
                {lessons.length === 0 && (
                  <p className="px-3 py-2 text-sm text-portal-muted">Nenhuma lição neste capítulo ainda.</p>
                )}
              </ul>
            </section>
          );
        })}
        {content.segments.length === 0 && (
          <p className="text-sm text-portal-muted">Este curso ainda não tem conteúdo publicado.</p>
        )}
      </div>
    </main>
  );
}
