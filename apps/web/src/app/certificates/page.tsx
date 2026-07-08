import Link from 'next/link';
import { apiFetch } from '../../lib/api';

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  file_url: string | null;
}

export default async function CertificatesPage(): Promise<React.ReactElement> {
  const certificates = (await apiFetch<Certificate[]>('/certificates')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Certificados</h1>
        <Link
          href="/certificates/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Emitir certificado
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Número</th>
              <th className="px-4 py-2">Emitido em</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {certificates.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Nenhum certificado emitido.
                </td>
              </tr>
            )}
            {certificates.map((certificate) => (
              <tr key={certificate.id}>
                <td className="px-4 py-2">{certificate.certificate_number}</td>
                <td className="px-4 py-2">{certificate.issued_at}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/certificates/${certificate.id}`}
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
    </main>
  );
}
