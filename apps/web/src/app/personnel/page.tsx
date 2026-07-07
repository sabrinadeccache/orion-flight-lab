import Link from 'next/link';
import { apiFetch } from '../../lib/api';

interface Instructor {
  id: string;
  full_name: string;
  cpf: string;
  anac_registration: string | null;
  active: boolean;
}

interface Examiner {
  id: string;
  full_name: string;
  cpf: string;
  anac_accreditation: string | null;
  active: boolean;
}

export default async function PersonnelPage(): Promise<React.ReactElement> {
  const [instructors, examiners] = await Promise.all([
    apiFetch<Instructor[]>('/personnel/instructors'),
    apiFetch<Examiner[]>('/personnel/examiners'),
  ]);

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Instrutores e examinadores</h1>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Instrutores</h2>
          <Link
            href="/personnel/instructors/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Novo instrutor
          </Link>
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
              {(!instructors || instructors.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Nenhum instrutor cadastrado.
                  </td>
                </tr>
              )}
              {instructors?.map((instructor) => (
                <tr key={instructor.id}>
                  <td className="px-4 py-2">
                    <Link
                      href={`/personnel/instructors/${instructor.id}`}
                      className="text-slate-900 hover:underline"
                    >
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
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Examinadores</h2>
          <Link
            href="/personnel/examiners/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Novo examinador
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">CPF</th>
                <th className="px-4 py-2">Credenciamento ANAC</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!examiners || examiners.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Nenhum examinador cadastrado.
                  </td>
                </tr>
              )}
              {examiners?.map((examiner) => (
                <tr key={examiner.id}>
                  <td className="px-4 py-2">
                    <Link
                      href={`/personnel/examiners/${examiner.id}`}
                      className="text-slate-900 hover:underline"
                    >
                      {examiner.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{examiner.cpf}</td>
                  <td className="px-4 py-2">{examiner.anac_accreditation ?? '—'}</td>
                  <td className="px-4 py-2">{examiner.active ? 'Ativo' : 'Inativo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
