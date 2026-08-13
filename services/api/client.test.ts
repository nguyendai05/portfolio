import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, setAdminCsrfToken } from './client';

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

describe('api client', () => {
  const fetchMock = vi.fn();
  const storage = new Map<string, string>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
    });
    storage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('unwraps a successful API payload', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { ok: true } }));

    await expect(api<{ ok: boolean }>('/projects')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('/api/projects', expect.objectContaining({ method: 'GET' }));
  });

  it('throws an ApiError with kind api for success false responses', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: false, error: 'Nope', code: 'NOPE', hint: 'Try later' }),
    );

    await expect(api('/projects')).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'api',
      status: 200,
      code: 'NOPE',
      hint: 'Try later',
      message: 'Nope',
    });
  });

  it('throws an ApiError with kind network when fetch rejects', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));

    await expect(api('/projects', { retry: 0 })).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'network',
      status: 0,
    });
  });

  it('throws an ApiError with kind parse for malformed JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{not-json', { status: 200 }));

    await expect(api('/projects')).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'parse',
      status: 200,
    });
  });

  it('retries GET network failures and 5xx responses up to two times', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(jsonResponse({ success: false, error: 'server down' }, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: ['ok'] }));

    await expect(api<string[]>('/projects', { retryDelayMs: 0 })).resolves.toEqual(['ok']);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry mutations or non-retryable 4xx responses', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, error: 'bad' }, { status: 500 }));
    await expect(
      api('/projects', { method: 'POST', body: { title: 'x' }, retryDelayMs: 0 }),
    ).rejects.toMatchObject({ kind: 'http', status: 500 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, error: 'missing' }, { status: 404 }));
    await expect(api('/projects/missing', { retryDelayMs: 0 })).rejects.toMatchObject({
      kind: 'http',
      status: 404,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses same-origin credentials and CSRF for admin mutations', async () => {
    setAdminCsrfToken('csrf-token');
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { count: 1 } }));

    await api('/projects/1', { auth: true, method: 'PATCH', body: { title: 'Updated' } });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/1',
      expect.objectContaining({
        credentials: 'same-origin',
        headers: expect.objectContaining({ 'X-CSRF-Token': 'csrf-token' }),
      }),
    );
  });

  it('reads structured error objects while preserving request IDs', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: false,
      error: { message: 'Invalid project', code: 'VALIDATION_ERROR' },
      requestId: 'req-12345678',
    }, { status: 400 }));
    await expect(api('/projects', { retry: 0 })).rejects.toMatchObject({
      message: 'Invalid project',
      code: 'VALIDATION_ERROR',
      requestId: 'req-12345678',
    });
  });
});
