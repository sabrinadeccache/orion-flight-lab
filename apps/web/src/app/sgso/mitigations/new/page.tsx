import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { NewMitigationForm } from './new-mitigation-form';

interface RiskOption {
  id: string;
  risk_level: string | null;
  probability: number;
  severity: number;
}

export default async function NewMitigationPage(): Promise<React.ReactElement> {
  const risks = (await apiFetch<RiskOption[]>('/sgso/risks')) ?? [];

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/sgso/hazards" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para SGSO — Perigos
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Nova mitigação</h1>

      {risks.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nenhum risco cadastrado ainda. É preciso ter um risco antes de registrar uma mitigação.{' '}
          <Link href="/sgso/risks/new" className="font-medium underline">
            Cadastrar risco
          </Link>
          .
        </div>
      ) : (
        <NewMitigationForm risks={risks} />
      )}
    </main>
  );
}
