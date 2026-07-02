import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { AuthenticatedUser, SupabaseJwtPayload } from '../types/authenticated-user';

/**
 * Validates the Supabase-issued JWT sent in the Authorization header and
 * attaches the resulting AuthenticatedUser (id, email, organizationId,
 * roles) to the request. Login itself always happens client-side via
 * supabase-js; this guard only ever verifies the token the client already
 * obtained.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Supabase JWT secret is not configured');
    }

    let payload: SupabaseJwtPayload;
    try {
      payload = jwt.verify(token, secret) as SupabaseJwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const organizationId = payload.organization_id ?? payload.app_metadata?.organization_id;
    const roles = payload.roles ?? payload.app_metadata?.roles ?? [];

    if (!organizationId) {
      throw new UnauthorizedException('Token is missing organization_id claim');
    }

    request.user = {
      id: payload.sub,
      email: payload.email ?? '',
      organizationId,
      roles,
    };

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header) return undefined;
    const [type, token] = header.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
