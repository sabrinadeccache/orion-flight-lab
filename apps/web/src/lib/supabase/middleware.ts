import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@orion/shared';

export interface SessionContext {
  response: NextResponse;
  userId: string | null;
  roles: Role[];
  organizationId: string | null;
}

/**
 * Refreshes the Supabase session cookie for the current request and
 * extracts the role/organization_id claims from the (already validated)
 * session, for use by the route-protection logic in middleware.ts.
 */
export async function updateSession(request: NextRequest): Promise<SessionContext> {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const appMetadata = (user?.app_metadata ?? {}) as {
    roles?: Role[];
    organization_id?: string;
  };

  return {
    response,
    userId: user?.id ?? null,
    roles: appMetadata.roles ?? [],
    organizationId: appMetadata.organization_id ?? null,
  };
}
