import { expect, test } from '@playwright/test';

const providerHosts = /generativelanguage\.googleapis\.com|api\.emailjs\.com/i;

test('public shell never calls Gemini or EmailJS from the browser', async ({ page }) => {
  const forbidden: string[] = [];
  page.on('request', (request) => {
    if (providerHosts.test(request.url())) forbidden.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  expect(forbidden).toEqual([]);
});

test('legacy hash is replaced with a browser route without a loop', async ({ page }) => {
  await page.goto('/#/about?source=legacy');
  await expect(page).toHaveURL(/\/about\?source=legacy$/);
});

test('reduced motion and pause motion stop decorative canvas animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.getByRole('button', { name: 'Resume motion' })).toBeDisabled();
});

test('db diagnostic is not public', async ({ request }) => {
  const response = await request.get('/api/db-test');
  expect(response.status()).toBe(404);
});

test('anonymous destructive mutation is rejected', async ({ request }) => {
  const response = await request.delete('/api/projects/1');
  expect(response.status()).toBe(401);
});
