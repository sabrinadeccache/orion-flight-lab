import Link from 'next/link';
import { apiFetch } from '../../lib/api';

interface Student {
  id: string;
  full_name: string;
  cpf: string;
  anac_record_number: string | null;
  active: boolean;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}): Promise<React.ReactElement> {
  const students = (await apiFetch<Student[]>('/students')) ?? [];
  const filter = searchParams.status;
  const filtered = filter
    ? students.filter((student) => (filter === 'ativo' ? student.active : !student.active))
    : students;

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Alunos</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/students" className="rounded-md border px-3 py-1.5">
            Todos
          </Link>
          <Link href="/students?status=ativo" className="rounded-md border px-3 py-1.5">
            Ativos
          </Link>
          <Link href="/students?status=inativo" className="rounded-md border px-3 py-1.5">
            Inativos
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">CPF</th>
              <th className="px-4 py-2">Registro ANAC</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nenhum aluno encontrado.
                </td>
              </tr>
            )}
            {filtered.map((student) => (
              <tr key={student.id}>
                <td className="px-4 py-2">
                  <Link href={`/students/${student.id}`} className="text-slate-900 hover:underline">
                    {student.full_name}
                  </Link>
                </td>
                <td className="px-4 py-2">{student.cpf}</td>
                <td className="px-4 py-2">{student.anac_record_number ?? '—'}</td>
                <td className="px-4 py-2">{student.active ? 'Ativo' : 'Inativo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
