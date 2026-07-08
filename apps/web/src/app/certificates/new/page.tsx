import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import { NewCertificateForm } from './new-certificate-form';

interface EnrollmentOption {
  id: string;
  student: { id: string; full_name: string };
  course: { id: string; name: string; code: string };
}

export default async function NewCertificatePage(): Promise<React.ReactElement> {
  const enrollments = (await apiFetch<EnrollmentOption[]>('/enrollments')) ?? [];

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/certificates" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para Certificados
      </Link>
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">Emitir certificado</h1>
      <p className="mb-6 text-sm text-slate-500">
        Emissão manual/retroativa (RN-05) — a maioria dos certificados é emitida automaticamente
        assim que os requisitos do curso são cumpridos. Use esta tela apenas para matrículas que já
        atendem aos requisitos mas ainda não têm um curso com aproveitamento mínimo configurado.
      </p>

      {enrollments.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nenhuma matrícula elegível encontrada — todas já têm certificado emitido, ou nenhuma
          matrícula foi registrada ainda.{' '}
          <Link href="/enrollments/new" className="font-medium underline">
            Matricular aluno
          </Link>
          .
        </div>
      ) : (
        <NewCertificateForm enrollments={enrollments} />
      )}
    </main>
  );
}
