import Link from 'next/link';
import { apiFetch } from '../../../lib/api';

interface StudentHistory {
  id: string;
  full_name: string;
  cpf: string;
  anac_record_number: string | null;
  enrollments: {
    id: string;
    status: string;
    course: { name: string };
    theoryExams: { id: string; result: string }[];
    practicalExams: { id: string; result: string }[];
    certificates: { id: string; certificate_number: string }[];
  }[];
  certificates: { id: string; certificate_number: string; issued_at: string }[];
}

export default async function StudentHistoryPage({
  params,
}: {
  params: { id: string };
}): Promise<React.ReactElement> {
  const student = await apiFetch<StudentHistory>(`/students/${params.id}/history`);

  if (!student) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-500">Aluno não encontrado ou API indisponível.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{student.full_name}</h1>
        <Link
          href={`/students/${params.id}/edit`}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Editar
        </Link>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        CPF {student.cpf} · Registro ANAC {student.anac_record_number ?? '—'}
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Matrículas (Seção 142.71)</h2>
        <div className="space-y-3">
          {student.enrollments.map((enrollment) => (
            <div key={enrollment.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-900">{enrollment.course.name}</p>
              <p className="text-sm text-slate-500">Status: {enrollment.status}</p>
              <p className="text-sm text-slate-500">
                Exames teóricos: {enrollment.theoryExams.length} · Exames práticos:{' '}
                {enrollment.practicalExams.length} · Certificados: {enrollment.certificates.length}
              </p>
            </div>
          ))}
          {student.enrollments.length === 0 && (
            <p className="text-slate-400">Nenhuma matrícula registrada.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-900">Certificados</h2>
        <ul className="list-inside list-disc text-sm text-slate-700">
          {student.certificates.map((certificate) => (
            <li key={certificate.id}>
              {certificate.certificate_number} — emitido em {certificate.issued_at}
            </li>
          ))}
          {student.certificates.length === 0 && (
            <p className="text-slate-400">Nenhum certificado emitido.</p>
          )}
        </ul>
      </section>
    </main>
  );
}
