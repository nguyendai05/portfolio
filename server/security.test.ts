import { describe, expect, it, vi } from 'vitest';
import {
  createSignedSessionCookie,
  deriveCsrfToken,
  hashIdentifier,
  getAdminSessionCookieName,
  parseSignedSessionCookie,
  verifyCsrfToken,
  setSessionCookie,
} from './security';

const secret = 'test-secret-that-is-long-enough-for-hmac';

describe('signed admin sessions', () => {
  it('round-trips a valid signed payload', () => {
    const token = createSignedSessionCookie(
      { sid: 'session-id', iat: 100, exp: 200, version: 3 },
      secret,
    );
    expect(parseSignedSessionCookie(token, secret, 150)).toEqual({
      sid: 'session-id', iat: 100, exp: 200, version: 3,
    });
  });

  it('rejects tampering and expired payloads', () => {
    const token = createSignedSessionCookie(
      { sid: 'session-id', iat: 100, exp: 200, version: 1 },
      secret,
    );
    expect(parseSignedSessionCookie(`${token}x`, secret, 150)).toBeNull();
    expect(parseSignedSessionCookie(token, secret, 201)).toBeNull();
  });

  it('derives a stable session-bound CSRF token', () => {
    const csrf = deriveCsrfToken('session-id', 2, secret);
    expect(verifyCsrfToken(csrf, 'session-id', 2, secret)).toBe(true);
    expect(verifyCsrfToken(csrf, 'other-session', 2, secret)).toBe(false);
  });

  it('hashes identifiers without exposing their source value', () => {
    const hashed = hashIdentifier('203.0.113.7', 'ip-key', 'v1');
    expect(hashed).toMatch(/^[a-f0-9]{64}$/);
    expect(hashed).not.toContain('203.0.113.7');
  });

  it('uses a browser-valid cookie name in local development', () => {
    const previous = process.env.NODE_ENV;
    delete process.env.VERCEL;
    process.env.NODE_ENV = 'development';
    expect(getAdminSessionCookieName()).toBe('portfolio_admin');
    process.env.NODE_ENV = previous;
  });

  it('uses a Secure __Host cookie in production', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const setHeader = vi.fn();
    setSessionCookie({ setHeader } as never, 'signed-token', 60);
    expect(setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringMatching(/^__Host-portfolio_admin=.*; Path=\/; HttpOnly; SameSite=Strict; Max-Age=60; Secure$/),
    );
    process.env.NODE_ENV = previous;
  });
});
