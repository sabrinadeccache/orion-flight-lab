import Link from 'next/link';
import { StatusBadge } from '../../components/ui/status-badge';
import { statusFromExpiry } from '../../lib/expiry';
import { apiFetch } from '../../lib/api';

interface Contract {
  id: string;
  contract_number: string;
  status: string;
  end_date: string | null;
}

export default async function ContractsPage(): Promise<React.ReactElement> {
  const contracts = (await apiFetch<Contract[]>('/contracts')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Contratos</h1>
        <Link
          href="/contracts/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Novo contrato
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Número</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Vencimento</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contracts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nenhum contrato cadastrado.
                </td>
              </tr>
            )}
            {contracts.map((contract) => (
              <tr key={contract.id}>
                <td className="px-4 py-2">{contract.contract_number}</td>
                <td className="px-4 py-2">{contract.status}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={statusFromExpiry(contract.end_date)} />
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/contracts/${contract.id}/edit`}
                    className="text-slate-600 hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
