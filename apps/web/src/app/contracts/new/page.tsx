import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import { NewContractForm } from './new-contract-form';

interface ClientOption {
  id: string;
  name: string;
}

export default async function NewContractPage(): Promise<React.ReactElement> {
  const clients = (await apiFetch<ClientOption[]>('/clients')) ?? [];

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/contracts" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para Contratos
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Novo contrato</h1>

      {clients.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nenhum cliente cadastrado ainda. É preciso ter um cliente antes de criar um contrato.{' '}
          <Link href="/clients/new" className="font-medium underline">
            Cadastrar cliente
          </Link>
          .
        </div>
      ) : (
        <NewContractForm clients={clients} />
      )}
    </main>
  );
}
