const STATUS_STYLES: Record<string, string> = {
  em_dia: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  a_vencer: 'bg-amber-100 text-amber-800 border-amber-300',
  vencido: 'bg-red-100 text-red-800 border-red-300',
};

const STATUS_LABELS: Record<string, string> = {
  em_dia: 'Em dia',
  a_vencer: 'A vencer',
  vencido: 'Vencido',
};

export type ComplianceStatus = 'em_dia' | 'a_vencer' | 'vencido';

export function StatusBadge({ status }: { status: ComplianceStatus }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
