import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { SupabaseAuthGuard } from './supabase-auth.guard';

function contextWithAuthHeader(header?: string): ExecutionContext {
  const request = { headers: { authorization: header } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('SupabaseAuthGuard', () => {
  const secret = 'local-test-secret-at-least-32-chars-long';

  function makeGuard(config: Record<string, string>): SupabaseAuthGuard {
    const configService = {
      get: (key: string) => config[key],
    } as unknown as ConfigService;
    return new SupabaseAuthGuard(configService);
  }

  it('accepts an HS256 token verified against SUPABASE_JWT_SECRET (local/self-hosted Supabase)', async () => {
    const guard = makeGuard({ SUPABASE_URL: 'http://localhost:54321', SUPABASE_JWT_SECRET: secret });
    const token = jwt.sign(
      { sub: 'user-1', app_metadata: { organization_id: 'org-1', roles: ['ADMIN'] } },
      secret,
      { algorithm: 'HS256' },
    );
    const context = contextWithAuthHeader(`Bearer ${token}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({
      id: 'user-1',
      email: '',
      organizationId: 'org-1',
      roles: ['ADMIN'],
    });
  });

  it('rejects an HS256 token signed with the wrong secret', async () => {
    const guard = makeGuard({ SUPABASE_URL: 'http://localhost:54321', SUPABASE_JWT_SECRET: secret });
    const token = jwt.sign({ sub: 'user-1' }, 'wrong-secret-at-least-32-characters-long', {
      algorithm: 'HS256',
    });
    const context = contextWithAuthHeader(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an HS256 token when SUPABASE_JWT_SECRET is not configured', async () => {
    const guard = makeGuard({ SUPABASE_URL: 'http://localhost:54321' });
    const token = jwt.sign({ sub: 'user-1' }, secret, { algorithm: 'HS256' });
    const context = contextWithAuthHeader(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a request with no Authorization header', async () => {
    const guard = makeGuard({ SUPABASE_URL: 'http://localhost:54321', SUPABASE_JWT_SECRET: secret });
    const context = contextWithAuthHeader(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow('Missing bearer token');
  });

  it('rejects an HS256 token missing the organization_id claim', async () => {
    const guard = makeGuard({ SUPABASE_URL: 'http://localhost:54321', SUPABASE_JWT_SECRET: secret });
    const token = jwt.sign({ sub: 'user-1' }, secret, { algorithm: 'HS256' });
    const context = contextWithAuthHeader(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toThrow('Token is missing organization_id claim');
  });
});
