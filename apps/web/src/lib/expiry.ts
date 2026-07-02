import type { ComplianceStatus } from '../components/ui/status-badge';

/** Mirrors the ExpiryStatus thresholds used by the API (30-day warning window). */
export function statusFromExpiry(expiresAt: string | Date | null | undefined): ComplianceStatus {
  if (!expiresAt) return 'em_dia';
  const date = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  const daysUntilExpiry = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (daysUntilExpiry < 0) return 'vencido';
  if (daysUntilExpiry <= 30) return 'a_vencer';
  return 'em_dia';
}
