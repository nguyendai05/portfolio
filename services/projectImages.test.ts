import { describe, expect, it } from 'vitest';
import { getOptimizedProjectImage } from './projectImages';

describe('getOptimizedProjectImage', () => {
  it('routes Microlink screenshot URLs through the Cloudinary fetch CDN', () => {
    const source =
      'https://api.microlink.io/?url=https%3A%2F%2Fexample.com&screenshot=true&embed=screenshot.url';

    const optimized = getOptimizedProjectImage(source);

    expect(optimized).toBe(
      `https://res.cloudinary.com/dak4x4d7u/image/fetch/f_auto,q_auto,w_1000/${encodeURIComponent(source)}`,
    );
  });

  it('keeps already optimized Cloudinary upload URLs unchanged', () => {
    const source =
      'https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1/screenshot.png';

    expect(getOptimizedProjectImage(source)).toBe(source);
  });
});
