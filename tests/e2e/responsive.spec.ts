import { expect, test } from '@playwright/test';

test('public shell does not overflow at the required viewport widths', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'The viewport matrix runs once in Chromium');
  for (const width of [320, 375, 414, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
    await page.goto('/');
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
  }
});
