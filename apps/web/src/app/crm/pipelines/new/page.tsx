import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { NewPipelineForm } from './new-pipeline-form';

interface ProposalOption {
  id: string;
  title: string;
}

export default async function NewPipelinePage(): Promise<React.ReactElement> {
  const proposals = (await apiFetch<ProposalOption[]>('/crm/proposals')) ?? [];

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/crm/pipelines" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para CRM — Pipelines
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Novo pipeline</h1>
      <NewPipelineForm proposals={proposals} />
    </main>
  );
}
