import { StatusBadge } from '../../components/ui/status-badge';
import { statusFromExpiry } from '../../lib/expiry';
import { apiFetch } from '../../lib/api';

interface MeResponse {
  fullName: string;
  organizationName: string;
  roles: string[];
}

interface ExpiringQualification {
  id: string;
  qualification_code: string;
  expires_at: string | null;
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const me = await apiFetch<MeResponse>('/auth/me');
  const expiringQualifications = (await apiFetch<ExpiringQualification[]>(
    '/qualifications/expiring?days=30',
  )) ?? [];

  const kpis = [
    { label: 'Alunos ativos', value: '—' },
    { label: 'Cursos ativos', value: '—' },
    { label: 'Instrutores', value: '—' },
    { label: 'Qualificações a vencer (30d)', value: expiringQualifications.length },
  ];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">
        {me ? `${me.fullName} · ${me.organizationName} · ${me.roles.join(', ')}` : 'Carregando perfil…'}
      </p>

      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-900">Semáforo de conformidade</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-4 py-2">Qualificação</th>
                <th className="px-4 py-2">Vencimento</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expiringQualifications.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    Nenhuma qualificação próxima do vencimento.
                  </td>
                </tr>
              )}
              {expiringQualifications.map((qualification) => (
                <tr key={qualification.id}>
                  <td className="px-4 py-2">{qualification.qualification_code}</td>
                  <td className="px-4 py-2">{qualification.expires_at ?? '—'}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={statusFromExpiry(qualification.expires_at)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
