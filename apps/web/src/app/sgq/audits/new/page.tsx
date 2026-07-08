import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { NewAuditForm } from './new-audit-form';

interface AuditProgramOption {
  id: string;
  year: number;
  description: string | null;
}

export default async function NewAuditPage(): Promise<React.ReactElement> {
  const auditPrograms = (await apiFetch<AuditProgramOption[]>('/sgq/audit-programs')) ?? [];

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/sgq/audit-programs" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para SGQ — Programas de Auditoria
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Nova auditoria</h1>

      {auditPrograms.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nenhum programa de auditoria cadastrado ainda. É preciso ter um programa antes de criar
          uma auditoria.{' '}
          <Link href="/sgq/audit-programs/new" className="font-medium underline">
            Cadastrar programa
          </Link>
          .
        </div>
      ) : (
        <NewAuditForm auditPrograms={auditPrograms} />
      )}
    </main>
  );
}
