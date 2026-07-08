import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { NewRiskForm } from './new-risk-form';

interface HazardOption {
  id: string;
  description: string;
}

export default async function NewRiskPage(): Promise<React.ReactElement> {
  const hazards = (await apiFetch<HazardOption[]>('/sgso/hazards')) ?? [];

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/sgso/hazards" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para SGSO — Perigos
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Novo risco</h1>

      {hazards.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nenhum perigo cadastrado ainda. É preciso ter um perigo antes de registrar um risco.{' '}
          <Link href="/sgso/hazards/new" className="font-medium underline">
            Cadastrar perigo
          </Link>
          .
        </div>
      ) : (
        <NewRiskForm hazards={hazards} />
      )}
    </main>
  );
}
