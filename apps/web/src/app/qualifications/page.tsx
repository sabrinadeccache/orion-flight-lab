import { StatusBadge } from '../../components/ui/status-badge';
import { statusFromExpiry } from '../../lib/expiry';
import { apiFetch } from '../../lib/api';

interface Qualification {
  id: string;
  qualification_code: string;
  expires_at: string | null;
}

/** Green/yellow/red map of qualification expiries across the organization. */
export default async function QualificationsPage(): Promise<React.ReactElement> {
  const qualifications = (await apiFetch<Qualification[]>('/qualifications/expiring?days=9999')) ?? [];

  const groups = {
    em_dia: qualifications.filter((q) => statusFromExpiry(q.expires_at) === 'em_dia'),
    a_vencer: qualifications.filter((q) => statusFromExpiry(q.expires_at) === 'a_vencer'),
    vencido: qualifications.filter((q) => statusFromExpiry(q.expires_at) === 'vencido'),
  } as const;

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Mapa de qualificações</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(Object.keys(groups) as (keyof typeof groups)[]).map((status) => (
          <div key={status} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <StatusBadge status={status} />
              <span className="text-sm text-slate-500">{groups[status].length}</span>
            </div>
            <ul className="space-y-1 text-sm text-slate-700">
              {groups[status].map((qualification) => (
                <li key={qualification.id}>{qualification.qualification_code}</li>
              ))}
              {groups[status].length === 0 && <li className="text-slate-400">Nenhuma</li>}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
