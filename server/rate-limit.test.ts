import { describe, expect, it, vi } from 'vitest';
import { cleanupSecurityState, consumeRateLimit } from './rate-limit';

describe('atomic rate-limit bucket', () => {
  it('uses one upsert and returns allowed quota metadata', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([[{ request_count: 3, retry_after: 45 }], []]);
    await expect(consumeRateLimit({ execute } as never, 'ai:ip', 'hash', 10, 600)).resolves.toEqual({
      allowed: true,
      count: 3,
      limit: 10,
      retryAfterSeconds: 45,
    });
    expect(execute.mock.calls[0][0]).toContain('ON DUPLICATE KEY UPDATE');
    expect(execute.mock.calls[0][1]).toEqual(['ai:ip', 'hash']);
  });

  it('rejects the first count above the configured limit', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([[{ request_count: 6, retry_after: 120 }], []]);
    await expect(consumeRateLimit({ execute } as never, 'login', 'hash', 5, 900)).resolves.toMatchObject({
      allowed: false,
      count: 6,
      retryAfterSeconds: 120,
    });
  });

  it('removes expired buckets, sessions and audit records by retention policy', async () => {
    const execute = vi.fn().mockResolvedValue([{ affectedRows: 1 }, []]);
    await cleanupSecurityState({ execute } as never);
    expect(execute).toHaveBeenCalledTimes(3);
    expect(execute.mock.calls[0][0]).toContain('rate_limit_buckets');
    expect(execute.mock.calls[1][0]).toContain('admin_sessions');
    expect(execute.mock.calls[2][0]).toContain('180 DAY');
  });
});
