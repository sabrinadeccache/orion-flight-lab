import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { NewNonConformityForm } from './new-non-conformity-form';

interface AuditOption {
  id: string;
  scheduled_at: string | null;
  scope: string | null;
}

export default async function NewNonConformityPage(): Promise<React.ReactElement> {
  const audits = (await apiFetch<AuditOption[]>('/sgq/audits')) ?? [];

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/sgq/audit-programs" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para SGQ — Programas de Auditoria
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Nova Não Conformidade</h1>

      {audits.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nenhuma auditoria cadastrada ainda. É preciso ter uma auditoria antes de registrar uma
          não conformidade.{' '}
          <Link href="/sgq/audits/new" className="font-medium underline">
            Cadastrar auditoria
          </Link>
          .
        </div>
      ) : (
        <NewNonConformityForm audits={audits} />
      )}
    </main>
  );
}
