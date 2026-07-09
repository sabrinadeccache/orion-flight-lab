import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { LessonViewer } from './lesson-viewer';

interface LessonView {
  id: string;
  name: string;
  duration_hours: string;
  enrollmentId: string;
  hasQuiz: boolean;
  quizId: string | null;
  progressStatus: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  materials: {
    id: string;
    name: string;
    type: 'ARQUIVO' | 'VIDEO_EXTERNO' | 'TEXTO';
    content_html: string | null;
    file_url: string | null;
  }[];
}

export default async function PortalLessonPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const lesson = await apiFetch<LessonView>(`/lms/lessons/${params.id}/view`);

  if (!lesson) {
    return (
      <main className="mx-auto max-w-3xl px-8 py-10">
        <p className="text-portal-muted">Lição não encontrada.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-8 py-10">
      <Link
        href={`/portal/enrollments/${lesson.enrollmentId}`}
        className="mb-6 inline-block font-mono text-xs text-portal-muted hover:text-portal-amber"
      >
        ← Voltar para o curso
      </Link>
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-portal-muted">
        {lesson.duration_hours}h de carga horária
      </p>
      <h1 className="mb-8 font-display text-2xl font-bold text-portal-text">{lesson.name}</h1>
      <LessonViewer lesson={lesson} />
    </main>
  );
}
