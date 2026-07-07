import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import { NewCourseForm } from './new-course-form';

interface CurriculumOption {
  id: string;
  name: string;
  version: string;
}

export default async function NewCoursePage(): Promise<React.ReactElement> {
  const curricula = (await apiFetch<CurriculumOption[]>('/training/curricula')) ?? [];

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Novo curso</h1>

      {curricula.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nenhum currículo cadastrado ainda. É preciso ter um currículo (e um programa de
          treinamento) antes de criar um curso.{' '}
          <Link href="/courses/setup" className="font-medium underline">
            Cadastrar programa e currículo
          </Link>
          .
        </div>
      ) : (
        <NewCourseForm curricula={curricula} />
      )}
    </main>
  );
}
