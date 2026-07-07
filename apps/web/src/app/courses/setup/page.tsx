'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabase } from '../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface TrainingProgram {
  id: string;
  name: string;
  code: string;
}

interface CurriculumItem {
  id: string;
  name: string;
  version: string;
  training_program_id: string;
}

export default function CourseSetupPage(): React.ReactElement {
  const { session } = useSupabase();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [curricula, setCurricula] = useState<CurriculumItem[]>([]);

  const [programName, setProgramName] = useState('');
  const [programCode, setProgramCode] = useState('');
  const [programError, setProgramError] = useState<string | null>(null);
  const [programLoading, setProgramLoading] = useState(false);

  const [curriculumProgramId, setCurriculumProgramId] = useState('');
  const [curriculumName, setCurriculumName] = useState('');
  const [curriculumVersion, setCurriculumVersion] = useState('');
  const [curriculumError, setCurriculumError] = useState<string | null>(null);
  const [curriculumLoading, setCurriculumLoading] = useState(false);

  async function loadData(): Promise<void> {
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.access_token}` };
    const [programsRes, curriculaRes] = await Promise.all([
      fetch(`${API_URL}/training/programs`, { headers }),
      fetch(`${API_URL}/training/curricula`, { headers }),
    ]);
    if (programsRes.ok) setPrograms((await programsRes.json()).data);
    if (curriculaRes.ok) setCurricula((await curriculaRes.json()).data);
  }

  useEffect(() => {
    void loadData();
  }, [session]);

  async function handleCreateProgram(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setProgramLoading(true);
    setProgramError(null);

    const response = await fetch(`${API_URL}/training/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ name: programName, code: programCode }),
    });

    setProgramLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setProgramError(body?.errors?.[0]?.message ?? 'Não foi possível criar o programa.');
      return;
    }

    setProgramName('');
    setProgramCode('');
    void loadData();
  }

  async function handleCreateCurriculum(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setCurriculumLoading(true);
    setCurriculumError(null);

    const response = await fetch(`${API_URL}/training/curricula`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        training_program_id: curriculumProgramId,
        name: curriculumName,
        version: curriculumVersion,
      }),
    });

    setCurriculumLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setCurriculumError(body?.errors?.[0]?.message ?? 'Não foi possível criar o currículo.');
      return;
    }

    setCurriculumName('');
    setCurriculumVersion('');
    void loadData();
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Programas e Currículos</h1>
        <Link href="/courses" className="text-sm text-slate-600 hover:underline">
          ← Voltar para cursos
        </Link>
      </div>
      <p className="mb-8 text-sm text-slate-500">
        Um Curso precisa de um Currículo, e um Currículo precisa de um Programa de Treinamento.
        Cadastre essa cadeia aqui antes de criar um novo curso.
      </p>

      <section className="mb-10 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-slate-900">Programas de Treinamento</h2>
        <ul className="mb-4 space-y-1 text-sm text-slate-700">
          {programs.map((program) => (
            <li key={program.id}>
              {program.name} <span className="text-slate-400">({program.code})</span>
            </li>
          ))}
          {programs.length === 0 && <li className="text-slate-400">Nenhum programa cadastrado.</li>}
        </ul>
        <form onSubmit={handleCreateProgram} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Nome</label>
            <input
              required
              value={programName}
              onChange={(event) => setProgramName(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Código</label>
            <input
              required
              value={programCode}
              onChange={(event) => setProgramCode(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={programLoading}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            + Programa
          </button>
        </form>
        {programError && <p className="mt-2 text-sm text-red-600">{programError}</p>}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-slate-900">Currículos</h2>
        <ul className="mb-4 space-y-1 text-sm text-slate-700">
          {curricula.map((curriculum) => (
            <li key={curriculum.id}>
              {curriculum.name} <span className="text-slate-400">(v{curriculum.version})</span>
            </li>
          ))}
          {curricula.length === 0 && <li className="text-slate-400">Nenhum currículo cadastrado.</li>}
        </ul>
        <form onSubmit={handleCreateCurriculum} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Programa</label>
            <select
              required
              value={curriculumProgramId}
              onChange={(event) => setCurriculumProgramId(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="">Selecione...</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Nome</label>
            <input
              required
              value={curriculumName}
              onChange={(event) => setCurriculumName(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Versão</label>
            <input
              required
              value={curriculumVersion}
              onChange={(event) => setCurriculumVersion(event.target.value)}
              placeholder="v1"
              className="w-20 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={curriculumLoading || programs.length === 0}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            + Currículo
          </button>
        </form>
        {curriculumError && <p className="mt-2 text-sm text-red-600">{curriculumError}</p>}
      </section>
    </main>
  );
}
