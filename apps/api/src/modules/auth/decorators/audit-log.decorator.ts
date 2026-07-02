import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log_meta';

export interface AuditLogMeta {
  action: string;
  entity: string;
}

/** Marks a route handler as auditable. Read by AuditLogInterceptor (RN-24). */
export const AuditLog = (meta: AuditLogMeta): ReturnType<typeof SetMetadata> =>
  SetMetadata(AUDIT_LOG_KEY, meta);
