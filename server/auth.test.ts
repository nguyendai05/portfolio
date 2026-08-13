import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyCors, applySecurityHeaders, requireAdmin } from './auth';
import { attachSession } from './session-auth';
import { deriveCsrfToken } from './security';

const originalNodeEnv = process.env.NODE_ENV;

function responseStub() {
  const headers = new Map<string, string>();
  const response = {
    statusCode: 200,
    setHeader: vi.fn((name: string, value: string) => headers.set(name, value)),
    status: vi.fn((status: number) => { response.statusCode = status; return response; }),
    json: vi.fn(() => response),
  };
  return { response, headers };
}

afterEach(() => {
  delete process.env.ALLOWED_ORIGINS;
  delete process.env.PUBLIC_ORIGIN;
  delete process.env.VERCEL;
  delete process.env.VERCEL_URL;
  process.env.NODE_ENV = originalNodeEnv;
});

describe('exact-origin CORS', () => {
  it('rejects an untrusted origin without credential headers', () => {
    process.env.NODE_ENV = 'production';
    process.env.PUBLIC_ORIGIN = 'https://portfolio.example';
    const { response, headers } = responseStub();
    const allowed = applyCors({ headers: { origin: 'https://attacker.example' } } as never, response as never);
    expect(allowed).toBe(false);
    expect(response.statusCode).toBe(403);
    expect(headers.has('Access-Control-Allow-Credentials')).toBe(false);
  });

  it('allows only an exact configured origin', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = 'https://portfolio.example';
    const { response, headers } = responseStub();
    const allowed = applyCors({ headers: { origin: 'https://portfolio.example' } } as never, response as never);
    expect(allowed).toBe(true);
    expect(headers.get('Access-Control-Allow-Origin')).toBe('https://portfolio.example');
    expect(headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });
});

describe('admin boundary and security headers', () => {
  it('rejects anonymous and missing-CSRF mutations, then accepts a valid token', () => {
    process.env.ADMIN_SESSION_SECRET = 'session-secret-with-more-than-thirty-two-characters';
    const anonymous = { method: 'DELETE', headers: {} };
    const anonymousResponse = responseStub();
    expect(requireAdmin(anonymous as never, anonymousResponse.response as never)).toBe(false);
    expect(anonymousResponse.response.statusCode).toBe(401);

    const sid = 'session-id';
    const version = 2;
    const session = {
      sid,
      version,
      iat: 1,
      exp: 2,
      sidHash: 'hash',
      csrfToken: deriveCsrfToken(sid, version, process.env.ADMIN_SESSION_SECRET),
    };
    const request = { method: 'DELETE', headers: {} };
    attachSession(request as never, session);
    const missingCsrf = responseStub();
    expect(requireAdmin(request as never, missingCsrf.response as never)).toBe(false);
    expect(missingCsrf.response.statusCode).toBe(403);

    request.headers = { 'x-csrf-token': session.csrfToken };
    expect(requireAdmin(request as never, responseStub().response as never)).toBe(true);
  });

  it('emits an exact-origin CSP without broad media wildcards', () => {
    const { response, headers } = responseStub();
    process.env.CSP_REPORT_ONLY = 'true';
    applySecurityHeaders(response as never);
    const csp = headers.get('Content-Security-Policy-Report-Only') || '';
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain('https://res.cloudinary.com');
    expect(csp).not.toMatch(/media-src 'self' https:(?:;|$)/);
  });
});
