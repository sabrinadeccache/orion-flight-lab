import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Must run after SupabaseAuthGuard. Guarantees request.organizationId is
 * present so downstream services never need to trust a client-supplied
 * organization_id — it always comes from the verified JWT claim.
 */
@Injectable()
export class OrganizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser; organizationId?: string }>();

    if (!request.user?.organizationId) {
      throw new ForbiddenException('No organization context found for this request');
    }

    request.organizationId = request.user.organizationId;
    return true;
  }
}
