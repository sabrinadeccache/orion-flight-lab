'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Material {
  id: string;
  name: string;
  type: 'ARQUIVO' | 'VIDEO_EXTERNO' | 'TEXTO';
  content_html: string | null;
  file_url: string | null;
}
interface LessonView {
  id: string;
  enrollmentId: string;
  hasQuiz: boolean;
  quizId: string | null;
  progressStatus: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  materials: Material[];
}

export function LessonViewer({ lesson }: { lesson: LessonView }): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const token = session?.access_token;
  const [status, setStatus] = useState(lesson.progressStatus);
  const [saving, setSaving] = useState(false);

  async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  }

  async function handleDownload(materialId: string): Promise<void> {
    // Open the tab synchronously (before any await) — a popup blocker will
    // silently swallow window.open() called after an awaited fetch.
    const tab = window.open('', '_blank');
    const response = await authedFetch(`/lms/materials/${materialId}/download`);
    if (!response.ok) {
      tab?.close();
      return;
    }
    const body = await response.json();
    if (tab && body.data?.url) {
      tab.location.href = body.data.url;
    }
  }

  async function handleMarkComplete(): Promise<void> {
    setSaving(true);
    const response = await authedFetch(`/lms/lessons/${lesson.id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ status: 'CONCLUIDO' }),
    });
    setSaving(false);
    if (response.ok) {
      setStatus('CONCLUIDO');
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
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
            {material.type === 'ARQUIVO' && (
              <button
                onClick={() => handleDownload(material.id)}
                className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-portal-text hover:bg-white/5"
              >
                Abrir arquivo
              </button>
            )}
          </div>
        ))}
        {lesson.materials.length === 0 && (
          <p className="text-sm text-portal-muted">Nenhum material cadastrado para esta lição.</p>
        )}
      </div>

      {lesson.hasQuiz && lesson.quizId && <QuizTaker quizId={lesson.quizId} authedFetch={authedFetch} />}

      <div className="flex items-center gap-3 border-t border-white/5 pt-6">
        <button
          onClick={handleMarkComplete}
          disabled={saving || status === 'CONCLUIDO'}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-60 ${
            status === 'CONCLUIDO'
              ? 'bg-portal-cyan/15 text-portal-cyan'
              : 'bg-portal-amber text-portal-void hover:bg-portal-amber/90'
          }`}
        >
          {status === 'CONCLUIDO' ? '✓ Lição concluída' : saving ? 'Salvando...' : 'Marcar como concluída'}
        </button>
      </div>
    </div>
  );
}

interface QuizQuestion {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
}
interface QuizAttempt {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

function QuizTaker({
  quizId,
  authedFetch,
}: {
  quizId: string;
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}): React.ReactElement {
  const [quiz, setQuiz] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    authedFetch(`/lms/quizzes/${quizId}/attempt`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setQuiz(body?.data ?? null));
  }, [quizId]);

  async function submit(): Promise<void> {
    const response = await authedFetch(`/lms/quizzes/${quizId}/attempts`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    if (!response.ok) return;
    const body = await response.json();
    setScore(Number(body.data.score));
  }

  if (!quiz) {
    return <p className="text-sm text-portal-muted">Carregando quiz...</p>;
  }

  return (
    <div className="rounded-xl border border-portal-amber/20 bg-portal-panel p-6">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-portal-amber">Quiz formativo</p>
      <h2 className="mb-4 font-display text-base font-semibold text-portal-text">{quiz.title}</h2>
      {score !== null ? (
        <p className="font-mono text-2xl font-semibold text-portal-cyan">{score.toFixed(0)}%</p>
      ) : (
        <div className="space-y-5">
          {quiz.questions.map((question) => (
            <div key={question.id}>
              <p className="mb-2 text-sm font-medium text-portal-text">{question.prompt}</p>
              <div className="space-y-1">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-portal-text/90 hover:bg-white/5"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={answers[question.id] === option.id}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                      className="accent-portal-amber"
                    />
                    {option.text}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={submit}
            className="rounded-full bg-portal-amber px-6 py-2.5 text-sm font-semibold text-portal-void hover:bg-portal-amber/90"
          >
            Enviar respostas
          </button>
        </div>
      )}
    </div>
  );
}
