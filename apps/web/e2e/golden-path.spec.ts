import { test, expect } from '@playwright/test';
import { readFixture } from './fixtures';

test('golden path: login -> dashboard -> create client', async ({ page }) => {
  // Next.js's App Router prefetches every visible <Link> (the sidebar nav
  // renders ~13 of them); a test navigating faster than a human aborts those
  // in-flight RSC prefetches mid-request, which Next.js logs as a console
  // error even though it's benign (it falls back to a normal navigation).
  // Not indicative of an app bug — filtered out rather than asserted on.
  const isBenignPrefetchAbort = (text: string): boolean =>
    text.includes('Failed to fetch RSC payload');

  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !isBenignPrefetchAbort(message.text())) {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  const { email, password } = readFixture();

  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL(/\/dashboard/);

  const clientName = `E2E Smoke Client ${Date.now()}`;

  await page.goto('/clients/new');
  await page.getByLabel('Nome').fill(clientName);
  await page.getByRole('button', { name: 'Cadastrar cliente' }).click();

  await expect(page).toHaveURL(/\/clients$/);
  await expect(page.getByRole('cell', { name: clientName })).toBeVisible();

  expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
});
