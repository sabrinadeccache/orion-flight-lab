import Link from 'next/link';
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Documentos regulatórios</h1>
        <Link
          href="/documents/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Novo documento
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Título</th>
              <th className="px-4 py-2">Categoria</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nenhum documento cadastrado.
                </td>
              </tr>
            )}
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="px-4 py-2">{document.title}</td>
                <td className="px-4 py-2">{document.category ?? '—'}</td>
                <td className="px-4 py-2">{document.status}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/documents/${document.id}/edit`}
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
