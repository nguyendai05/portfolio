import { describe, expect, it } from 'vitest';
import { getLegacyHashRedirect } from './legacyHashRedirect';

describe('legacy hash redirect', () => {
  it('maps known hash routes and lets route query win', () => {
    expect(getLegacyHashRedirect('https://portfolio.test/?lang=en#/work/demo?lang=vi&ref=old')).toBe(
      '/work/demo?lang=vi&ref=old',
    );
  });

  it('maps the legacy home route', () => {
    expect(getLegacyHashRedirect('https://portfolio.test/#/')).toBe('/');
  });

  it('ignores non-route and cross-origin-looking hashes', () => {
    expect(getLegacyHashRedirect('https://portfolio.test/#section')).toBeNull();
    expect(getLegacyHashRedirect('https://portfolio.test/#/https://evil.test')).toBeNull();
  });
});
