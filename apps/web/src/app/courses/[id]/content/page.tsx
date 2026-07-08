import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { ContentManager } from './content-manager';

interface Course {
  id: string;
  name: string;
}

export default async function CourseContentPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const course = await apiFetch<Course>(`/training/courses/${params.id}`);

  if (!course) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Curso não encontrado ou API indisponível.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/courses" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para Cursos
      </Link>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Conteúdo — {course.name}</h1>
      <p className="mb-6 text-sm text-slate-500">
        Segmentos → Módulos → Unidades → Subunidades → Lições → Materiais e quizzes formativos.
      </p>
      <ContentManager courseId={course.id} />
    </main>
  );
}
