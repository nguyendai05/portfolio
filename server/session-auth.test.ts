import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAdminSession,
  getAttachedSession,
  hasValidCsrf,
  loadAdminSession,
  revokeAdminSession,
  revokeAllAdminSessions,
  verifyAdminPassword,
} from './session-auth';

const secret = 'session-secret-with-more-than-thirty-two-characters';
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.ADMIN_SESSION_SECRET = secret;
  delete process.env.ADMIN_PASSWORD_HASH;
  delete process.env.VERCEL;
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

function responseStub() {
  return { setHeader: vi.fn() };
}

describe('stateful admin session lifecycle', () => {
  it('creates a fixed eight-hour session and persists only a sid hash', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce([[{ session_version: 4 }], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const response = responseStub();
    const before = Math.floor(Date.now() / 1000);
    const session = await createAdminSession({ execute } as never, response as never);
    expect(session.version).toBe(4);
    expect(session.exp - session.iat).toBe(8 * 60 * 60);
    expect(session.iat).toBeGreaterThanOrEqual(before);
    expect(execute.mock.calls[1][1][0]).toMatch(/^[a-f0-9]{64}$/);
    expect(execute.mock.calls[1][1][0]).not.toContain(session.sid);
    expect(response.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('HttpOnly'));
  });

  it('loads a valid DB-backed session and rejects revoked/global-version sessions', async () => {
    const response = responseStub();
    const createExecute = vi.fn()
      .mockResolvedValueOnce([[{ session_version: 2 }], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const created = await createAdminSession({ execute: createExecute } as never, response as never);
    const cookie = String(response.setHeader.mock.calls[0][1]).split(';')[0];
    const request = { headers: { cookie } };
    const validRow = {
      sid_hash: created.sidHash,
      token_version: 2,
      session_version: 2,
      expires_at: new Date(Date.now() + 60_000),
      revoked_at: null,
    };
    await expect(loadAdminSession({ execute: vi.fn().mockResolvedValue([[validRow], []]) } as never, request as never))
      .resolves.toMatchObject({ sidHash: created.sidHash, version: 2 });
    await expect(loadAdminSession({ execute: vi.fn().mockResolvedValue([[{ ...validRow, revoked_at: new Date() }], []]) } as never, request as never))
      .resolves.toBeNull();
    await expect(loadAdminSession({ execute: vi.fn().mockResolvedValue([[{ ...validRow, session_version: 3 }], []]) } as never, request as never))
      .resolves.toBeNull();
  });

  it('validates session-bound CSRF and exposes attached state', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce([[{ session_version: 1 }], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const session = await createAdminSession({ execute } as never, responseStub() as never);
    expect(hasValidCsrf({ headers: { 'x-csrf-token': session.csrfToken } } as never, session)).toBe(true);
    expect(hasValidCsrf({ headers: { 'x-csrf-token': 'tampered' } } as never, session)).toBe(false);
    const request = { headers: {}, adminSession: session };
    expect(getAttachedSession(request as never)).toBe(session);
  });

  it('revokes one session and can bump the global version', async () => {
    const execute = vi.fn().mockResolvedValue([{ affectedRows: 1 }, []]);
    const response = responseStub();
    const session = { sid: 'sid', sidHash: 'hash', iat: 1, exp: 2, version: 1, csrfToken: 'csrf' };
    await revokeAdminSession({ execute } as never, response as never, session);
    expect(execute.mock.calls[0][0]).toContain('revoked_at');
    expect(response.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('Max-Age=0'));
    await revokeAllAdminSessions({ execute } as never);
    expect(execute).toHaveBeenCalledTimes(3);
  });
});

describe('admin password policy', () => {
  it('accepts plaintext only outside production', async () => {
    process.env.ADMIN_PASSWORD = 'local-secret';
    await expect(verifyAdminPassword('local-secret')).resolves.toBe(true);
    process.env.NODE_ENV = 'production';
    await expect(verifyAdminPassword('local-secret')).resolves.toBe(false);
  });

  it('verifies a scrypt encoded hash', async () => {
    const salt = 'test-salt';
    const expected = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt('correct-password', salt, 32, (error, value) => error ? reject(error) : resolve(value));
    });
    process.env.ADMIN_PASSWORD_HASH = `scrypt$${salt}$${expected.toString('base64url')}`;
    process.env.NODE_ENV = 'production';
    await expect(verifyAdminPassword('correct-password')).resolves.toBe(true);
    await expect(verifyAdminPassword('wrong-password')).resolves.toBe(false);
  });
});
