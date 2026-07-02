import Link from 'next/link';
import { apiFetch } from '../../lib/api';

interface Instructor {
  id: string;
  full_name: string;
  cpf: string;
  anac_registration: string | null;
  active: boolean;
}

export default async function PersonnelPage(): Promise<React.ReactElement> {
  const instructors = (await apiFetch<Instructor[]>('/personnel/instructors')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Instrutores e examinadores</h1>
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
            {instructors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nenhum instrutor cadastrado.
                </td>
              </tr>
            )}
            {instructors.map((instructor) => (
              <tr key={instructor.id}>
                <td className="px-4 py-2">
                  <Link href={`/personnel/${instructor.id}`} className="text-slate-900 hover:underline">
                    {instructor.full_name}
                  </Link>
                </td>
                <td className="px-4 py-2">{instructor.cpf}</td>
                <td className="px-4 py-2">{instructor.anac_registration ?? '—'}</td>
                <td className="px-4 py-2">{instructor.active ? 'Ativo' : 'Inativo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
