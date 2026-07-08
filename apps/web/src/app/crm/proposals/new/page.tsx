import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { NewProposalForm } from './new-proposal-form';

interface ClientOption {
  id: string;
  name: string;
}

interface AccountOption {
  id: string;
  client: { id: string; name: string } | null;
}

export default async function NewProposalPage(): Promise<React.ReactElement> {
  const [clients, accounts] = await Promise.all([
    apiFetch<ClientOption[]>('/clients'),
    apiFetch<AccountOption[]>('/crm/accounts'),
  ]);

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/crm/proposals" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para CRM — Propostas
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Nova proposta</h1>

      {!clients || clients.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nenhum cliente cadastrado ainda. É preciso ter um cliente antes de criar uma proposta.{' '}
          <Link href="/clients/new" className="font-medium underline">
            Cadastrar cliente
          </Link>
          .
        </div>
      ) : (
        <NewProposalForm clients={clients} accounts={accounts ?? []} />
      )}
    </main>
  );
}
