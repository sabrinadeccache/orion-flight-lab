import { test, expect } from '@playwright/test';
import { readFixture } from './fixtures';

test('golden path: login -> dashboard -> create client', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
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
