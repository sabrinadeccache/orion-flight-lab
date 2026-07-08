import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import { DownloadCertificateButton } from './download-certificate-button';

interface CertificateDetail {
  id: string;
  certificate_number: string;
  issued_at: string;
  file_url: string | null;
  student: { id: string; full_name: string };
  enrollment: { id: string; course: { id: string; name: string; code: string } };
  qualifications: { id: string; qualification_code: string; issued_at: string }[];
}

export default async function CertificateDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const certificate = await apiFetch<CertificateDetail>(`/certificates/${params.id}`);

  if (!certificate) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Certificado não encontrado.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/certificates" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para Certificados
      </Link>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">
        Certificado {certificate.certificate_number}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        {certificate.student.full_name} — {certificate.enrollment.course.name} (
        {certificate.enrollment.course.code}) · emitido em {certificate.issued_at}
      </p>

      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
        <DownloadCertificateButton id={certificate.id} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-900">Qualificações vinculadas</h2>
        <ul className="list-inside list-disc text-sm text-slate-700">
          {certificate.qualifications.map((qualification) => (
            <li key={qualification.id}>
              {qualification.qualification_code} — emitida em {qualification.issued_at}
            </li>
          ))}
          {certificate.qualifications.length === 0 && (
            <p className="text-slate-400">
              Nenhuma qualificação automática vinculada a este certificado.
            </p>
          )}
        </ul>
      </section>
    </main>
  );
}
