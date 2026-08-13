import { expect, test } from '@playwright/test';

for (const path of ['/', '/work', '/about', '/gallery', '/contact', '/admin/login']) {
  test(`direct request renders ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('#root')).toBeAttached();
  });
}

test('unknown project detail is noindex after routing', async ({ page }) => {
  await page.route('**/api/projects?slug=*', (route) => route.fulfill({
    status: 404,
    contentType: 'application/json',
    body: JSON.stringify({ success: false, error: 'Project not found', code: 'NOT_FOUND' }),
  }));
  await page.goto('/work/definitely-not-a-real-project');
  await expect(page).toHaveTitle(/Project (not found|unavailable)/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('unknown route renders a noindex 404', async ({ page }) => {
  await page.goto('/definitely-not-a-route');
  await expect(page).toHaveTitle(/Page not found/i);
  await expect(page.getByRole('heading', { name: /does not exist/i })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
