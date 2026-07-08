import Link from 'next/link';
import { apiFetch } from '../../../lib/api';

interface AuditProgram {
  id: string;
  year: number;
  description: string | null;
}

export default async function AuditProgramsPage(): Promise<React.ReactElement> {
  const auditPrograms = (await apiFetch<AuditProgram[]>('/sgq/audit-programs')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">SGQ — Programas de Auditoria</h1>
        <Link
          href="/sgq/audit-programs/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Novo programa
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Ano</th>
              <th className="px-4 py-2">Descrição</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditPrograms.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Nenhum programa de auditoria cadastrado.
                </td>
              </tr>
            )}
            {auditPrograms.map((auditProgram) => (
              <tr key={auditProgram.id}>
                <td className="px-4 py-2">{auditProgram.year}</td>
                <td className="px-4 py-2">{auditProgram.description ?? '—'}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/sgq/audit-programs/${auditProgram.id}`}
                    className="text-slate-600 hover:underline"
                  >
                    Ver detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
