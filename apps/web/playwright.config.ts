import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke test only (CLAUDE.md §16 item 4) — runs against a real local Supabase
 * stack (Auth/Postgres/Storage via `supabase start`) + the real API, never
 * the hosted Supabase project. See supabase/rls/README.md for the migration
 * order this depends on, and apps/web/e2e/global-setup.ts for the fixture.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
