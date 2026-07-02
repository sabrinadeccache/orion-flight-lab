import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, hasExclusiveRoleConflict } from '@orion/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from './types/authenticated-user';

export interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName: string;
  roles: Role[];
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GERENTE_QUALIDADE must never be combined with any other role on the
   * same profile — the quality manager function must remain independent
   * from operational roles.
   */
  assertValidRoleCombination(roles: Role[]): void {
    if (hasExclusiveRoleConflict(roles)) {
      throw new BadRequestException(
        'GERENTE_QUALIDADE role cannot be combined with any other role',
      );
    }
  }

  async getMe(user: AuthenticatedUser): Promise<MeResponse> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id: user.id },
      include: { organization: true },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    this.assertValidRoleCombination(profile.roles as Role[]);

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      organizationId: profile.organization_id,
      organizationName: profile.organization.name,
      roles: profile.roles as Role[],
    };
  }
}
