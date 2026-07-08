'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Student {
  id: string;
  full_name: string;
  cpf: string;
  email: string | null;
  anac_record_number: string | null;
  active: boolean;
  user_profile_id: string | null;
}

export default function EditStudentPage({
  params,
}: {
  params: { id: string };
}): React.ReactElement {
  const { session } = useSupabase();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [anacRecordNumber, setAnacRecordNumber] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch(`${API_URL}/students/${params.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { data: Student } | null) => {
        if (!body) return;
        setStudent(body.data);
        setFullName(body.data.full_name);
        setCpf(body.data.cpf);
        setEmail(body.data.email ?? '');
        setAnacRecordNumber(body.data.anac_record_number ?? '');
        setActive(body.data.active);
      });
  }, [session, params.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/students/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        full_name: fullName,
        cpf,
        email: email || undefined,
        anac_record_number: anacRecordNumber || undefined,
        active,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.errors?.[0]?.message ?? 'Não foi possível salvar as alterações.');
      return;
    }

    router.push(`/students/${params.id}`);
    router.refresh();
  }

  async function handleDelete(): Promise<void> {
    if (!confirm('Excluir este aluno? Essa ação não pode ser desfeita.')) return;
    setLoading(true);

    const response = await fetch(`${API_URL}/students/${params.id}`, {
      method: 'DELETE',
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });

    setLoading(false);

    if (!response.ok) {
      setError('Não foi possível excluir o aluno.');
      return;
    }

    router.push('/students');
    router.refresh();
  }

  async function handleInvite(): Promise<void> {
    setInviting(true);
    setInviteMessage(null);

    const response = await fetch(`${API_URL}/students/${params.id}/invite`, {
      method: 'POST',
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });

    setInviting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setInviteMessage(body?.errors?.[0]?.message ?? 'Não foi possível convidar o aluno.');
      return;
    }

    setInviteMessage('Convite enviado! O aluno vai receber um e-mail para acessar o portal.');
    router.refresh();
  }

  if (!student) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <p className="text-slate-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link href="/students" className="mb-4 inline-block text-sm text-slate-600 hover:underline">
        ← Voltar para Alunos
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Editar aluno</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nome completo</label>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">CPF</label>
          <input
            required
            value={cpf}
            onChange={(event) => setCpf(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            E-mail (opcional, necessário para convidar ao portal do aluno)
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Registro ANAC (opcional)
          </label>
          <input
            value={anacRecordNumber}
            onChange={(event) => setAnacRecordNumber(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          Aluno ativo
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Excluir aluno
          </button>
        </div>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Portal do aluno (LMS)</h2>
        {student.user_profile_id ? (
          <p className="text-sm text-emerald-600">Este aluno já tem acesso ao portal.</p>
        ) : (
          <>
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviting || !student.email}
              className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {inviting ? 'Enviando convite...' : 'Convidar para o portal'}
            </button>
            {!student.email && (
              <p className="mt-1 text-xs text-slate-500">
                Cadastre um e-mail acima e salve antes de convidar.
              </p>
            )}
            {inviteMessage && <p className="mt-2 text-sm text-slate-700">{inviteMessage}</p>}
          </>
        )}
      </div>
    </main>
  );
}
