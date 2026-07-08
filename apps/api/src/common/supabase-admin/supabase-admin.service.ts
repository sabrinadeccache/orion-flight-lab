import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Role } from '@orion/shared';

/**
 * Thin wrapper around the Supabase Auth Admin API (service role key), used to
 * provision a real login for a Student (LMS portal invite). Mirrors the
 * StorageService pattern (same env vars, same client construction) — see
 * apps/api/src/common/storage/storage.service.ts.
 */
@Injectable()
export class SupabaseAdminService {
  private readonly client: SupabaseClient | null;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.client = url && serviceRoleKey ? createClient(url, serviceRoleKey) : null;
  }

  /**
   * Creates a Supabase Auth user for a Student and sends them the built-in
   * invite email. `inviteUserByEmail` only accepts `data` (user_metadata),
   * so organization_id/roles are set via a follow-up updateUserById call
   * into app_metadata — the claim SupabaseAuthGuard actually reads from the
   * JWT (see auth module armadilha in CLAUDE.md §14: JWT claims come from
   * app_metadata, not user_metadata).
   */
  async inviteStudent(email: string, organizationId: string): Promise<string> {
    if (!this.client) {
      throw new BadRequestException('Supabase Admin is not configured (missing SUPABASE_SERVICE_ROLE_KEY)');
    }

    const { data, error } = await this.client.auth.admin.inviteUserByEmail(email, {
      data: { organization_id: organizationId, roles: [Role.ALUNO] },
    });
    if (error || !data.user) {
      throw new BadRequestException(error?.message ?? 'Failed to invite student');
    }

    const { error: updateError } = await this.client.auth.admin.updateUserById(data.user.id, {
      app_metadata: { organization_id: organizationId, roles: [Role.ALUNO] },
    });
    if (updateError) {
      throw new BadRequestException(updateError.message);
    }

    return data.user.id;
  }
}
