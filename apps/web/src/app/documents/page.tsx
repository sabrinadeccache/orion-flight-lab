import { apiFetch } from '../../lib/api';

interface Document {
  id: string;
  title: string;
  category: string | null;
  status: string;
}

export default async function DocumentsPage(): Promise<React.ReactElement> {
  const documents = (await apiFetch<Document[]>('/documents')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Documentos regulatórios</h1>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Título</th>
              <th className="px-4 py-2">Categoria</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Nenhum documento cadastrado.
                </td>
              </tr>
            )}
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="px-4 py-2">{document.title}</td>
                <td className="px-4 py-2">{document.category ?? '—'}</td>
                <td className="px-4 py-2">{document.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
