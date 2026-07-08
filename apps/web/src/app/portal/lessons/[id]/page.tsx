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
      <main className="mx-auto max-w-3xl p-8">
        <p className="text-slate-500">Lição não encontrada.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link
        href={`/portal/enrollments/${lesson.enrollmentId}`}
        className="mb-4 inline-block text-sm text-slate-600 hover:underline"
      >
        ← Voltar para o curso
      </Link>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">{lesson.name}</h1>
      <p className="mb-6 text-sm text-slate-500">Carga horária: {lesson.duration_hours}h</p>
      <LessonViewer lesson={lesson} />
    </main>
  );
}
