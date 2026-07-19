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
 * The hosted project signs access tokens asymmetrically (ES256, rotatable
 * key pairs) and publishes the public keys at
 * /auth/v1/.well-known/jwks.json, so that's the primary path. Local/
 * self-hosted Supabase stacks (`supabase start`, used by the CI test-e2e
 * job) sign with HS256 against a shared secret instead — both are current,
 * legitimate Supabase Auth signing modes, so a token whose header says
 * `alg: HS256` is verified against `SUPABASE_JWT_SECRET` rather than JWKS.
 * This isn't a test-only bypass: it's real signature verification either
 * way, just against whichever key material that mode actually uses.
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
    const header = jwt.decode(token, { complete: true })?.header;

    if (header?.alg === 'HS256') {
      return this.verifyHs256(token);
    }

    return this.verifyJwks(token);
  }

  private verifyHs256(token: string): Promise<SupabaseJwtPayload> {
    const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');

    return new Promise((resolve, reject) => {
      if (!secret) {
        reject(new UnauthorizedException('Invalid or expired token'));
        return;
      }

      jwt.verify(token, secret, { algorithms: ['HS256'] }, (err, decoded) => {
        if (err || !decoded) {
          reject(new UnauthorizedException('Invalid or expired token'));
          return;
        }
        resolve(decoded as SupabaseJwtPayload);
      });
    });
  }

  private verifyJwks(token: string): Promise<SupabaseJwtPayload> {
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
