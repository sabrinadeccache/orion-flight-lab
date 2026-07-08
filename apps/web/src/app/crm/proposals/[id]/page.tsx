import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';

interface ProposalDetail {
  id: string;
  title: string;
  value: string;
  status: string;
  valid_until: string | null;
  client: { id: string; name: string } | null;
  account: { id: string } | null;
  pipelines: {
    id: string;
    name: string;
    stage: string;
  }[];
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default async function ProposalDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const proposal = await apiFetch<ProposalDetail>(`/crm/proposals/${params.id}`);

  if (!proposal) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Proposta não encontrada.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/crm/proposals" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para CRM — Propostas
      </Link>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{proposal.title}</h1>
        <Link
          href={`/crm/proposals/${proposal.id}/edit`}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Editar
        </Link>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Cliente: {proposal.client?.name ?? '—'} · Valor: {proposal.value} · Status: {proposal.status} ·
        Válida até: {formatDate(proposal.valid_until)}
      </p>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Pipelines</h2>
          <Link
            href="/crm/pipelines/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Novo pipeline
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Estágio</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proposal.pipelines.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    Nenhum pipeline vinculado a esta proposta.
                  </td>
                </tr>
              )}
              {proposal.pipelines.map((pipeline) => (
                <tr key={pipeline.id}>
                  <td className="px-4 py-2">{pipeline.name}</td>
                  <td className="px-4 py-2">{pipeline.stage}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/crm/pipelines/${pipeline.id}`}
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
      </section>
    </main>
  );
}
