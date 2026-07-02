import { apiFetch } from '../../lib/api';

interface Course {
  id: string;
  name: string;
  code: string;
  status: string;
  max_students: number;
}

export default async function CoursesPage(): Promise<React.ReactElement> {
  const courses = (await apiFetch<Course[]>('/training/courses')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Cursos</h1>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Limite de alunos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nenhum curso cadastrado.
                </td>
              </tr>
            )}
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="px-4 py-2">{course.name}</td>
                <td className="px-4 py-2">{course.code}</td>
                <td className="px-4 py-2">{course.status}</td>
                <td className="px-4 py-2">{course.max_students}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
