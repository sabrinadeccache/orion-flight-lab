import Link from 'next/link';
import { apiFetch } from '../../../lib/api';

interface SafetyOccurrence {
  id: string;
  description: string;
  occurred_at: string;
  severity: string | null;
  hazard_id: string | null;
}

const SEVERITY_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

function severityLabel(severity: string | null): string {
  if (!severity) return '—';
  return SEVERITY_LABELS[severity] ?? severity;
}

export default async function SafetyOccurrencesPage(): Promise<React.ReactElement> {
  const occurrences = (await apiFetch<SafetyOccurrence[]>('/sgso/safety-occurrences')) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">SGSO — Ocorrências de Segurança</h1>
        <Link
          href="/sgso/safety-occurrences/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Nova ocorrência
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Descrição</th>
              <th className="px-4 py-2">Ocorrida em</th>
              <th className="px-4 py-2">Severidade</th>
              <th className="px-4 py-2">Perigo vinculado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {occurrences.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma ocorrência de segurança registrada.
                </td>
              </tr>
            )}
            {occurrences.map((occurrence) => (
              <tr key={occurrence.id}>
                <td className="px-4 py-2">{occurrence.description}</td>
                <td className="px-4 py-2">{occurrence.occurred_at}</td>
                <td className="px-4 py-2">{severityLabel(occurrence.severity)}</td>
                <td className="px-4 py-2">{occurrence.hazard_id ? 'Sim' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
