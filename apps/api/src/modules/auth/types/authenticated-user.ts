import { Role } from '@orion/shared';

/** Shape attached to `request.user` after SupabaseAuthGuard runs. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  roles: Role[];
}

/** Expected claims of a Supabase-issued access token relevant to this app. */
export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  organization_id?: string;
  roles?: Role[];
  app_metadata?: {
    organization_id?: string;
    roles?: Role[];
  };
  [key: string]: unknown;
}
