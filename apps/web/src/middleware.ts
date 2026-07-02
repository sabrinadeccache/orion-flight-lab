import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@orion/shared';
import { updateSession } from './lib/supabase/middleware';

/** Routes that don't require an authenticated session. */
const PUBLIC_ROUTES = ['/login'];

/**
 * Route prefix -> roles allowed to access it. Prefixes not listed here are
 * accessible to any authenticated user regardless of role.
 */
const ROUTE_ROLES: Record<string, Role[]> = {
  '/reports': [Role.ADMIN, Role.GERENTE_QUALIDADE, Role.GERENTE_SEGURANCA],
  '/financial': [Role.ADMIN, Role.FINANCEIRO],
  '/contracts': [Role.ADMIN, Role.FINANCEIRO, Role.COMERCIAL],
  '/clients': [Role.ADMIN, Role.COMERCIAL],
};

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function requiredRolesFor(pathname: string): Role[] | null {
  const match = Object.keys(ROUTE_ROLES).find((prefix) => pathname.startsWith(prefix));
  return match ? ROUTE_ROLES[match] : null;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const { response, userId, roles } = await updateSession(request);

  if (!userId) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requiredRoles = requiredRolesFor(pathname);
  if (requiredRoles && !requiredRoles.some((role) => roles.includes(role))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
