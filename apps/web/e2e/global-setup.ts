import { randomUUID } from 'crypto';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { Client as PgClient } from 'pg';

const FIXTURE_PATH = join(__dirname, '.fixture.json');

/**
 * Provisions one isolated Organization + one real staff (ADMIN) user against
 * the LOCAL Supabase stack started by the `test-e2e` CI job (never the
 * hosted project — see CLAUDE.md §11, §16 item 4). Mirrors the manual
 * methodology in CLAUDE.md §15, minus the teardown step: this whole stack is
 * a throwaway Docker container destroyed when the job ends, unlike the real,
 * persistent Supabase project that §15's cleanup rule exists to protect.
 */
export default async function globalSetup(): Promise<void> {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const directUrl = requireEnv('DIRECT_URL');

  const orgId = randomUUID();
  const suffix = orgId.slice(0, 8);
  const email = `e2e-smoke+${suffix}@example.test`;
  const password = 'E2eSmoke!2026';

  const pg = new PgClient({ connectionString: directUrl });
  await pg.connect();
  try {
    // service_role has no INSERT grant on every table via supabase-js (see
    // CLAUDE.md §14) — inserting the tenant root directly as the DB owner
    // sidesteps that, same as the execute_sql pattern used for manual testing.
    await pg.query(
      `insert into organizations (id, name, cnpj, anac_ctac_code, active, created_at, updated_at)
       values ($1, $2, $3, $4, true, now(), now())`,
      [orgId, `E2E Smoke Org ${suffix}`, `E2E-CNPJ-${suffix}`, `E2E-CTAC-${suffix}`],
    );
  } finally {
    await pg.end();
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { organization_id: orgId, roles: ['ADMIN'] },
  });
  if (error || !data.user) {
    throw new Error(`Failed to create E2E smoke test user: ${error?.message}`);
  }

  const pg2 = new PgClient({ connectionString: directUrl });
  await pg2.connect();
  try {
    await pg2.query(
      `insert into user_profiles (id, organization_id, email, full_name, roles, active, created_at, updated_at)
       values ($1, $2, $3, $4, $5::"Role"[], true, now(), now())`,
      [data.user.id, orgId, email, 'E2E Smoke Admin', ['ADMIN']],
    );
  } finally {
    await pg2.end();
  }

  writeFileSync(FIXTURE_PATH, JSON.stringify({ orgId, email, password }, null, 2));
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var for E2E global setup: ${name}`);
  }
  return value;
}
