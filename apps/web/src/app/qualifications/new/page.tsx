import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import { NewQualificationForm } from './new-qualification-form';

interface StudentOption {
  id: string;
  full_name: string;
}

interface CourseOption {
  id: string;
  name: string;
  code: string;
}

export default async function NewQualificationPage(): Promise<React.ReactElement> {
  const students = (await apiFetch<StudentOption[]>('/students')) ?? [];
  const courses = (await apiFetch<CourseOption[]>('/training/courses')) ?? [];

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/qualifications" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para Qualificações
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Nova qualificação</h1>

      {students.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nenhum aluno cadastrado ainda. É preciso ter um aluno antes de registrar uma qualificação.{' '}
          <Link href="/students/new" className="font-medium underline">
            Cadastrar aluno
          </Link>
          .
        </div>
      ) : (
        <NewQualificationForm students={students} courses={courses} />
      )}
    </main>
  );
}
