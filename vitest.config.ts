import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'routing/legacyHashRedirect.ts',
        'server/auth.ts',
        'server/contact.ts',
        'server/pagination.ts',
        'server/rate-limit.ts',
        'server/security.ts',
        'server/session-auth.ts',
        'server/validation.ts',
        'services/api/client.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
