import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { NewAccountForm } from './new-account-form';

interface ClientOption {
  id: string;
  name: string;
}

export default async function NewAccountPage(): Promise<React.ReactElement> {
  const clients = (await apiFetch<ClientOption[]>('/clients')) ?? [];

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/crm/accounts" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para CRM — Contas
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Nova conta</h1>

      {clients.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nenhum cliente cadastrado ainda. É preciso ter um cliente antes de criar uma conta.{' '}
          <Link href="/clients/new" className="font-medium underline">
            Cadastrar cliente
          </Link>
          .
        </div>
      ) : (
        <NewAccountForm clients={clients} />
      )}
    </main>
  );
}
