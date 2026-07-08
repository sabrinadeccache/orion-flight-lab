import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type StorageBucket =
  | 'regulatory-docs'
  | 'certificates'
  | 'contracts'
  | 'student-docs'
  | 'instructor-docs'
  | 'lms-materials';

/**
 * Thin wrapper around the Supabase Storage admin client (service role key).
 * All buckets are private; callers are expected to prefix object paths with
 * the organization_id (see supabase/migrations/0003_storage_buckets.sql).
 */
@Injectable()
export class StorageService {
  private readonly client: SupabaseClient | null;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.client = url && serviceRoleKey ? createClient(url, serviceRoleKey) : null;
  }

  async upload(
    bucket: StorageBucket,
    organizationId: string,
    fileName: string,
    file: Buffer,
    contentType?: string,
  ): Promise<string> {
    const path = `${organizationId}/${fileName}`;

    if (!this.client) {
      // No Supabase project configured (local/dev scaffold) — return the
      // path that would have been used so callers can persist it.
      return path;
    }

    const { error } = await this.client.storage
      .from(bucket)
      .upload(path, file, { contentType, upsert: true });

    if (error) {
      throw error;
    }

    return path;
  }

  /**
   * Buckets are private, so a stored path (e.g. `Document.file_url`) can't be
   * linked to directly — callers need a time-limited signed URL to download
   * it. Returns null when no Supabase project is configured (local/dev
   * scaffold), same convention as upload().
   */
  async createSignedUrl(
    bucket: StorageBucket,
    path: string,
    expiresInSeconds = 3600,
  ): Promise<string | null> {
    if (!this.client) {
      return null;
    }

    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  }
}
