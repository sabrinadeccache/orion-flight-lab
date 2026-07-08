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
          <div key={material.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-2 font-medium text-slate-900">{material.name}</p>
            {material.type === 'TEXTO' && material.content_html && (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: material.content_html }}
              />
            )}
            {material.type === 'VIDEO_EXTERNO' && material.file_url && (
              <a
                href={material.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-slate-600 underline"
              >
                Assistir vídeo
              </a>
            )}
            {material.type === 'ARQUIVO' && (
              <button
                onClick={() => handleDownload(material.id)}
                className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Abrir arquivo
              </button>
            )}
          </div>
        ))}
        {lesson.materials.length === 0 && (
          <p className="text-sm text-slate-400">Nenhum material cadastrado para esta lição.</p>
        )}
      </div>

      {lesson.hasQuiz && lesson.quizId && <QuizTaker quizId={lesson.quizId} authedFetch={authedFetch} />}

      <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
        <button
          onClick={handleMarkComplete}
          disabled={saving || status === 'CONCLUIDO'}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === 'CONCLUIDO' ? 'Lição concluída' : saving ? 'Salvando...' : 'Marcar como concluída'}
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
    return <p className="text-sm text-slate-400">Carregando quiz...</p>;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 font-medium text-slate-900">{quiz.title}</h2>
      {score !== null ? (
        <p className="text-sm font-medium text-slate-700">Sua nota: {score.toFixed(0)}%</p>
      ) : (
        <div className="space-y-4">
          {quiz.questions.map((question) => (
            <div key={question.id}>
              <p className="mb-1 text-sm font-medium text-slate-800">{question.prompt}</p>
              <div className="space-y-1">
                {question.options.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={answers[question.id] === option.id}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                    />
                    {option.text}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={submit}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Enviar respostas
          </button>
        </div>
      )}
    </div>
  );
}
