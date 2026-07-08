import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { NewChargeForm } from './new-charge-form';

interface ClientOption {
  id: string;
  name: string;
}

interface ContractOption {
  id: string;
  contract_number: string;
}

export default async function NewChargePage(): Promise<React.ReactElement> {
  const [clients, contracts] = await Promise.all([
    apiFetch<ClientOption[]>('/clients'),
    apiFetch<ContractOption[]>('/contracts'),
  ]);

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link
        href="/financial/charges"
        className="mb-4 inline-block text-sm text-slate-600 hover:underline"
      >
        ← Voltar para Financeiro — Cobranças
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Nova cobrança</h1>

      {!clients || clients.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nenhum cliente cadastrado ainda. É preciso ter um cliente antes de criar uma cobrança.{' '}
          <Link href="/clients/new" className="font-medium underline">
            Cadastrar cliente
          </Link>
          .
        </div>
      ) : (
        <NewChargeForm clients={clients} contracts={contracts ?? []} />
      )}
    </main>
  );
}
