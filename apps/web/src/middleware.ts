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
  '/crm': [Role.ADMIN, Role.COMERCIAL],
  '/sgq': [Role.ADMIN, Role.GERENTE_QUALIDADE],
  '/sgso': [Role.ADMIN, Role.GERENTE_SEGURANCA],
  '/portal': [Role.ALUNO],
};

/** Routes a pure-ALUNO session (the LMS student portal) may reach. */
const STUDENT_ALLOWED_PREFIXES = ['/portal'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isPureStudent(roles: string[]): boolean {
  return roles.length > 0 && roles.every((role) => role === Role.ALUNO);
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

  // The LMS student portal is confined to its own routes — a student has no
  // business browsing the staff back office (which is otherwise open by
  // default to any authenticated user, see ROUTE_ROLES comment above).
  if (
    isPureStudent(roles) &&
    !STUDENT_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.redirect(new URL('/portal', request.url));
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
