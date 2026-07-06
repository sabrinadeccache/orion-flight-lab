import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AUDIT_LOG_KEY } from '../decorators/audit-log.decorator';

function buildContext(user?: { id: string; organizationId: string }): ExecutionContext {
  const request = { user };
  const handlerRef = jest.fn();
  const classRef = jest.fn();
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => handlerRef,
    getClass: () => classRef,
  } as unknown as ExecutionContext;
}

function buildHandler(result: unknown): CallHandler {
  return { handle: () => of(result) };
}

describe('AuditLogInterceptor (RN-24)', () => {
  let interceptor: AuditLogInterceptor;
  let reflector: { getAllAndOverride: jest.Mock };
  let prisma: { auditLog: { create: jest.Mock } };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    prisma = { auditLog: { create: jest.fn().mockResolvedValue({}) } };
    interceptor = new AuditLogInterceptor(
      reflector as unknown as Reflector,
      prisma as unknown as PrismaService,
    );
  });

  it('does not write an audit_log row when the route has no @AuditLog metadata', (done) => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = buildContext({ id: 'user-1', organizationId: 'org-1' });
    const handler = buildHandler({ data: { id: 'entity-1' } });

    interceptor.intercept(context, handler).subscribe(() => {
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
      done();
    });
  });

  it('does not write an audit_log row when there is no authenticated user', (done) => {
    reflector.getAllAndOverride.mockReturnValue({ action: 'create', entity: 'Student' });
    const context = buildContext(undefined);
    const handler = buildHandler({ data: { id: 'entity-1' } });

    interceptor.intercept(context, handler).subscribe(() => {
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
      done();
    });
  });

  it('writes an audit_log row for an auditable route, unwrapping the {data} envelope', (done) => {
    reflector.getAllAndOverride.mockReturnValue({ action: 'create', entity: 'Student' });
    const context = buildContext({ id: 'user-1', organizationId: 'org-1' });
    const handler = buildHandler({ data: { id: 'entity-1', full_name: 'Fulano' }, meta: null, errors: null });

    interceptor.intercept(context, handler).subscribe(() => {
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organization_id: 'org-1',
          actor_user_id: 'user-1',
          action: 'create',
          entity: 'Student',
          entity_id: 'entity-1',
        }),
      });
      done();
    });
  });

  it('reads AUDIT_LOG_KEY metadata from both the handler and the class', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = buildContext({ id: 'user-1', organizationId: 'org-1' });
    const handler = buildHandler({ data: { id: 'entity-1' } });

    interceptor.intercept(context, handler);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(AUDIT_LOG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
