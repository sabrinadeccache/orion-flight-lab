import { apiFetch } from '../../lib/api';

interface Client {
  id: string;
  name: string;
  cnpj_cpf: string | null;
  type: string;
  active: boolean;
}

export default async function ClientsPage(): Promise<React.ReactElement> {
  const clients = (await apiFetch<Client[]>('/clients')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Clientes</h1>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">CNPJ/CPF</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            )}
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="px-4 py-2">{client.name}</td>
                <td className="px-4 py-2">{client.cnpj_cpf ?? '—'}</td>
                <td className="px-4 py-2">{client.type}</td>
                <td className="px-4 py-2">{client.active ? 'Ativo' : 'Inativo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
