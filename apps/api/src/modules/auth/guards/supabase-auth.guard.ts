import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import jwksClient, { JwksClient } from 'jwks-rsa';
import { Request } from 'express';
import { AuthenticatedUser, SupabaseJwtPayload } from '../types/authenticated-user';

/**
 * Validates the Supabase-issued JWT sent in the Authorization header and
 * attaches the resulting AuthenticatedUser (id, email, organizationId,
 * roles) to the request. Login itself always happens client-side via
 * supabase-js; this guard only ever verifies the token the client already
 * obtained.
 *
 * Supabase projects sign access tokens asymmetrically (ES256, rotatable key
 * pairs) and publish the public keys at /auth/v1/.well-known/jwks.json —
 * there is no shared secret to verify against, so we fetch and cache the
 * signing key by `kid` instead.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly jwks: JwksClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    this.jwks = jwksClient({
      jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 10 * 60 * 1000,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = await this.verify(token);

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

  private verify(token: string): Promise<SupabaseJwtPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        (header, callback) => {
          if (!header.kid) {
            callback(new Error('Token header is missing kid'));
            return;
          }
          this.jwks.getSigningKey(header.kid, (err, key) => {
            if (err || !key) {
              callback(err ?? new Error('Signing key not found'));
              return;
            }
            callback(null, key.getPublicKey());
          });
        },
        { algorithms: ['ES256', 'RS256'] },
        (err, decoded) => {
          if (err || !decoded) {
            reject(new UnauthorizedException('Invalid or expired token'));
            return;
          }
          resolve(decoded as SupabaseJwtPayload);
        },
      );
    });
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header) return undefined;
    const [type, token] = header.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
