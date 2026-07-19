import { readFileSync } from 'fs';
import { join } from 'path';

interface E2EFixture {
  orgId: string;
  email: string;
  password: string;
}

/** Reads the fixture written by global-setup.ts (separate process, no shared memory). */
export function readFixture(): E2EFixture {
  const raw = readFileSync(join(__dirname, '.fixture.json'), 'utf-8');
  return JSON.parse(raw) as E2EFixture;
}
