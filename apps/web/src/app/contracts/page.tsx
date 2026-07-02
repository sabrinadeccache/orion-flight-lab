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
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Contratos</h1>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Número</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Vencimento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contracts.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
