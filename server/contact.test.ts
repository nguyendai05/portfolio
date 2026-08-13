import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  withConnection: vi.fn(),
  withTransaction: vi.fn(),
  consumeRateLimit: vi.fn(),
  getCurrentEmailConfig: vi.fn(),
  sendEmailJS: vi.fn(),
}));

vi.mock('./db', () => ({
  withConnection: mocks.withConnection,
  withTransaction: mocks.withTransaction,
}));
vi.mock('./rate-limit', () => ({ consumeRateLimit: mocks.consumeRateLimit }));
vi.mock('./email', () => ({
  getCurrentEmailConfig: mocks.getCurrentEmailConfig,
  sendEmailJS: mocks.sendEmailJS,
}));

import { handleContact, handleContactResend } from './contact';
import { deriveCsrfToken } from './security';

function responseStub() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    headers: new Map<string, string>(),
    setHeader: vi.fn((name: string, value: string) => response.headers.set(name, value)),
    status: vi.fn((status: number) => { response.statusCode = status; return response; }),
    json: vi.fn((body: unknown) => { response.body = body; return response; }),
  };
  return response;
}

const validBody = {
  name: 'Test User',
  email: 'test@example.com',
  topic: 'other',
  message: 'A valid contact message',
};
const idempotencyKey = '123e4567-e89b-42d3-a456-426614174000';

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RATE_LIMIT_HMAC_KEY = 'rate-limit-secret';
  process.env.ADMIN_SESSION_SECRET = 'session-secret-with-more-than-thirty-two-characters';
});

describe('contact idempotency and delivery', () => {
  it('rejects a missing idempotency key before touching the database', async () => {
    const response = responseStub();
    await handleContact({ method: 'POST', body: validBody, headers: {} } as never, response as never);
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ code: 'IDEMPOTENCY_KEY_REQUIRED' });
    expect(mocks.withConnection).not.toHaveBeenCalled();
  });

  it('returns the existing record for a client retry without delivering again', async () => {
    mocks.withConnection.mockImplementationOnce(async (work) => work({
      execute: vi.fn().mockResolvedValue([[{ id: 41, delivery_status: 'sent' }], []]),
    }));
    const response = responseStub();
    await handleContact({
      method: 'POST',
      body: validBody,
      headers: { 'idempotency-key': idempotencyKey },
    } as never, response as never);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ success: true, data: { messageId: 41, delivery: 'sent' } });
    expect(mocks.withTransaction).not.toHaveBeenCalled();
    expect(mocks.sendEmailJS).not.toHaveBeenCalled();
  });

  it('stores an ambiguous provider timeout as unknown without retrying', async () => {
    mocks.withConnection
      .mockImplementationOnce(async (work) => work({ execute: vi.fn().mockResolvedValue([[], []]) }))
      .mockImplementationOnce(async (work) => work({ execute: vi.fn().mockResolvedValue([{ affectedRows: 1 }, []]) }))
      .mockImplementationOnce(async (work) => work({ execute: vi.fn().mockResolvedValue([{ affectedRows: 1 }, []]) }));
    mocks.withTransaction.mockImplementation(async (work) => work({
      execute: vi.fn().mockResolvedValue([{ insertId: 77 }, []]),
    }));
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, count: 1, limit: 10, retryAfterSeconds: 60 });
    mocks.getCurrentEmailConfig.mockReturnValue({
      serviceId: 'service', contactTemplateId: 'template', publicKey: 'public', privateKey: 'private',
    });
    mocks.sendEmailJS.mockResolvedValue({ ok: false, ambiguous: true, code: 'EMAILJS_TIMEOUT' });
    const response = responseStub();
    await handleContact({
      method: 'POST',
      body: validBody,
      headers: { 'idempotency-key': idempotencyKey },
      socket: { remoteAddress: '127.0.0.1' },
    } as never, response as never);
    expect(response.statusCode).toBe(202);
    expect(response.body).toEqual({ success: true, data: { messageId: 77, delivery: 'unknown' } });
    expect(mocks.sendEmailJS).toHaveBeenCalledTimes(1);
  });

  it('returns 429 when either atomic contact bucket is exhausted', async () => {
    mocks.withConnection.mockImplementationOnce(async (work) => work({ execute: vi.fn().mockResolvedValue([[], []]) }));
    mocks.withTransaction.mockRejectedValue(Object.assign(new Error('CONTACT_RATE_LIMITED'), { retryAfter: 321 }));
    const response = responseStub();
    await handleContact({
      method: 'POST',
      body: validBody,
      headers: { 'idempotency-key': idempotencyKey },
      socket: { remoteAddress: '127.0.0.1' },
    } as never, response as never);
    expect(response.statusCode).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('321');
  });

  it('claims a failed delivery once and performs one explicit admin resend', async () => {
    mocks.withConnection
      .mockImplementationOnce(async (work) => work({
        execute: vi.fn()
          .mockResolvedValueOnce([{ affectedRows: 1 }, []])
          .mockResolvedValueOnce([[validBody], []]),
      }))
      .mockImplementationOnce(async (work) => work({ execute: vi.fn().mockResolvedValue([{ affectedRows: 1 }, []]) }));
    mocks.getCurrentEmailConfig.mockReturnValue({
      serviceId: 'service', contactTemplateId: 'template', publicKey: 'public', privateKey: 'private',
    });
    mocks.sendEmailJS.mockResolvedValue({ ok: true });
    const sid = 'admin-session';
    const csrfToken = deriveCsrfToken(sid, 1, process.env.ADMIN_SESSION_SECRET!);
    const response = responseStub();
    await handleContactResend({
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
      adminSession: { sid, version: 1, iat: 1, exp: 2, sidHash: 'hash', csrfToken },
    } as never, response as never, 88);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ success: true, data: { messageId: 88, delivery: 'sent' } });
    expect(mocks.sendEmailJS).toHaveBeenCalledTimes(1);
  });
});
