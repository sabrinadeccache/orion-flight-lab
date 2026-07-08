import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { NewSafetyOccurrenceForm } from './new-safety-occurrence-form';

interface HazardOption {
  id: string;
  description: string;
}

export default async function NewSafetyOccurrencePage(): Promise<React.ReactElement> {
  const hazards = (await apiFetch<HazardOption[]>('/sgso/hazards')) ?? [];

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link
        href="/sgso/safety-occurrences"
        className="mb-4 inline-block text-sm text-slate-600 hover:underline"
      >
        ← Voltar para SGSO — Ocorrências de Segurança
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Nova ocorrência de segurança</h1>
      <NewSafetyOccurrenceForm hazards={hazards} />
    </main>
  );
}
