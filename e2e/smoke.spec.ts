import { test, expect } from '@playwright/test';

test('homepage renders without JS errors and API failures', async ({ page }) => {
  const jsErrors: string[] = [];
  const apiFailures: { status: number; url: string }[] = [];

  page.on('pageerror', (err) => jsErrors.push(err.message));
  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('/api/') && res.status() >= 500) {
      apiFailures.push({ status: res.status(), url: new URL(url).pathname });
    }
  });

  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20_000 });

  // Wait for dashboard content to appear (proves React rendered successfully)
  await expect(page.locator('body')).toContainText('仪表盘', { timeout: 15_000 });
  await expect(page.locator('body')).toContainText('交易总览');

  // No JS runtime errors
  expect(jsErrors, `JS errors: ${jsErrors.join('; ')}`).toHaveLength(0);

  // No 5xx API responses
  const unique = apiFailures.map((f) => `${f.status} ${f.url}`);
  expect(unique, `API 5xx: ${unique.join(', ')}`).toHaveLength(0);
});
