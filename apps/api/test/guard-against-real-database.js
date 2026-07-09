const fs = require('fs');
const path = require('path');

/**
 * Jest globalSetup for test:integration — runs once, before any spec file,
 * regardless of describe.skip. Aborts the whole run if DATABASE_URL or
 * DIRECT_URL resolve to the real Supabase project instead of an ephemeral
 * Postgres.
 *
 * Plain JS (not TS): Jest requires globalSetup directly, outside the
 * ts-jest transform pipeline, so a .ts file here would fail to parse.
 *
 * Why this reads the root .env file itself instead of just checking
 * process.env: globalSetup runs in its own process, before any spec file
 * is required — but it's *importing @prisma/client inside the spec file*
 * that triggers Prisma's own dotenv auto-load of the root .env (see
 * CLAUDE.md §14). So at globalSetup time, process.env.DATABASE_URL is only
 * populated if the shell explicitly exported it; the .env-sourced value
 * that would silently take effect later isn't visible yet. Checking both
 * covers the explicit-export case and the "nobody exported anything but
 * .env has a real URL" case documented in CLAUDE.md §14 as having actually
 * happened once.
 */
const SUPABASE_HOST_PATTERN = /supabase\.co|pooler\.supabase\.com/i;
const CHECKED_KEYS = ['DATABASE_URL', 'DIRECT_URL'];

function readRootEnvFile() {
  const envPath = path.join(__dirname, '..', '..', '..', '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  const values = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) {
      values[match[1]] = match[2];
    }
  }
  return values;
}

module.exports = function globalSetup() {
  const fromEnvFile = readRootEnvFile();

  for (const key of CHECKED_KEYS) {
    const value = process.env[key] ?? fromEnvFile[key];
    if (value && SUPABASE_HOST_PATTERN.test(value)) {
      throw new Error(
        `test:integration refused to run: ${key} resolves to a real Supabase host. ` +
          'This suite must run against an ephemeral Postgres (see .github/workflows/ci.yml), ' +
          'never the project used for manual validation (CLAUDE.md §11/§15). ' +
          `Move/rename the root .env, or override ${key} with a local/container Postgres URL, before rerunning.`,
      );
    }
  }
};
