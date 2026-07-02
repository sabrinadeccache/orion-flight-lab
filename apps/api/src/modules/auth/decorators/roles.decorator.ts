import { SetMetadata } from '@nestjs/common';
import { Role } from '@orion/shared';

export const ROLES_KEY = 'roles';

/** Declares which roles may access a route. Enforced by RolesGuard. */
export const Roles = (...roles: Role[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
