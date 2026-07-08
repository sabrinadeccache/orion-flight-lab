import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { PipelineStageActions } from './stage-actions';

interface PipelineDetail {
  id: string;
  name: string;
  stage: string;
  expected_close_date: string | null;
  proposal: {
    id: string;
    title: string;
    status: string;
    valid_until: string | null;
  } | null;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default async function PipelineDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const pipeline = await apiFetch<PipelineDetail>(`/crm/pipelines/${params.id}`);

  if (!pipeline) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Pipeline não encontrado.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/crm/pipelines" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para CRM — Pipelines
      </Link>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">{pipeline.name}</h1>
      <p className="mb-6 text-sm text-slate-500">
        Previsão de fechamento: {formatDate(pipeline.expected_close_date)}
        {pipeline.proposal && (
          <>
            {' '}
            · Proposta:{' '}
            <Link href={`/crm/proposals/${pipeline.proposal.id}`} className="underline">
              {pipeline.proposal.title}
            </Link>{' '}
            (status: {pipeline.proposal.status}, válida até: {formatDate(pipeline.proposal.valid_until)})
          </>
        )}
      </p>

      <PipelineStageActions id={pipeline.id} stage={pipeline.stage} />
    </main>
  );
}
