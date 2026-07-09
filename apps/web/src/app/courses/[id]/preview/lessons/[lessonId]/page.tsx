import Link from 'next/link';
import { apiFetch } from '../../../../../../lib/api';
import { DownloadButton } from './download-button';

interface LessonPreview {
  id: string;
  name: string;
  duration_hours: string;
  hasQuiz: boolean;
  materials: {
    id: string;
    name: string;
    type: 'ARQUIVO' | 'VIDEO_EXTERNO' | 'TEXTO';
    content_html: string | null;
    file_url: string | null;
  }[];
}

export default async function CoursePreviewLessonPage({
  params,
}: {
  params: { id: string; lessonId: string };
}): Promise<React.ReactElement> {
  const lesson = await apiFetch<LessonPreview>(`/training/lessons/${params.lessonId}/preview`);

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
        href={`/courses/${params.id}/preview`}
        className="mb-6 inline-block font-mono text-xs text-portal-muted hover:text-portal-amber"
      >
        ← Voltar para o curso
      </Link>
      <div className="mb-8 rounded-lg border border-portal-amber/20 bg-portal-amber/5 px-4 py-2 font-mono text-xs text-portal-amber">
        Modo de visualização — sem envio de quiz nem "marcar como concluída".
      </div>
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-portal-muted">
        {lesson.duration_hours}h de carga horária
      </p>
      <h1 className="mb-8 font-display text-2xl font-bold text-portal-text">{lesson.name}</h1>

      <div className="space-y-4">
        {lesson.materials.map((material) => (
          <div key={material.id} className="rounded-xl border border-white/5 bg-portal-panel p-6">
            <p className="mb-3 font-display text-sm font-semibold text-portal-text">{material.name}</p>
            {material.type === 'TEXTO' && material.content_html && (
              <div
                className="prose prose-invert prose-sm max-w-none text-portal-text/90"
                dangerouslySetInnerHTML={{ __html: material.content_html }}
              />
            )}
            {material.type === 'VIDEO_EXTERNO' && material.file_url && (
              <a
                href={material.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex aspect-video items-center justify-center rounded-lg bg-black/40 text-sm font-medium text-portal-amber hover:bg-black/60"
              >
                ▶ Assistir vídeo
              </a>
            )}
            {material.type === 'ARQUIVO' && <DownloadButton materialId={material.id} />}
          </div>
        ))}
        {lesson.materials.length === 0 && (
          <p className="text-sm text-portal-muted">Nenhum material cadastrado para esta lição.</p>
        )}
        {lesson.hasQuiz && (
          <div className="rounded-xl border border-portal-amber/20 bg-portal-panel p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-portal-amber">
              Esta lição tem um quiz formativo
            </p>
            <p className="mt-1 text-sm text-portal-muted">
              O quiz só pode ser respondido pelo aluno — aqui é só a visualização do conteúdo.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
