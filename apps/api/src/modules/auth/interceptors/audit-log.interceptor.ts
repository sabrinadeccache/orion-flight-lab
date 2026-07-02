import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AUDIT_LOG_KEY, AuditLogMeta } from '../decorators/audit-log.decorator';
import { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Writes an immutable audit_log row (RN-24) whenever a route decorated with
 * @AuditLog(...) completes successfully. Never updates or deletes rows —
 * audit_log is insert-only both here and at the database level (see RLS
 * policy audit_log_insert_only).
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.getAllAndOverride<AuditLogMeta | undefined>(AUDIT_LOG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!meta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();

    return next.handle().pipe(
      tap((result) => {
        const user = request.user;
        if (!user) return;

        const entityId =
          result && typeof result === 'object' && 'id' in result
            ? String((result as { id: unknown }).id)
            : undefined;

        void this.prisma.auditLog.create({
          data: {
            organization_id: user.organizationId,
            actor_user_id: user.id,
            action: meta.action,
            entity: meta.entity,
            entity_id: entityId,
            payload: result === undefined ? Prisma.JsonNull : (result as Prisma.InputJsonValue),
          },
        });
      }),
    );
  }
}
