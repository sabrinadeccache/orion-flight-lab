import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { NewCorrectiveActionForm } from './new-corrective-action-form';

interface NonConformityOption {
  id: string;
  description: string;
}

export default async function NewCorrectiveActionPage(): Promise<React.ReactElement> {
  const nonConformities = (await apiFetch<NonConformityOption[]>('/sgq/non-conformities')) ?? [];

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/sgq/audit-programs" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para SGQ — Programas de Auditoria
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Nova Ação Corretiva</h1>

      {nonConformities.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nenhuma não conformidade cadastrada ainda. É preciso ter uma não conformidade antes de
          criar uma ação corretiva.{' '}
          <Link href="/sgq/non-conformities/new" className="font-medium underline">
            Registrar não conformidade
          </Link>
          .
        </div>
      ) : (
        <NewCorrectiveActionForm nonConformities={nonConformities} />
      )}
    </main>
  );
}
