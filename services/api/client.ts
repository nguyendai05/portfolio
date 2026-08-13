const API_BASE = '/api';
const LEGACY_ADMIN_TOKEN_STORAGE_KEY = 'xuni_admin_token';
let adminCsrfToken: string | null = null;

export type ApiErrorKind = 'network' | 'http' | 'api' | 'parse' | 'abort';
export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface ApiOptions {
  method?: ApiMethod;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
  retry?: number;
  retryDelayMs?: number;
}

interface ApiErrorOptions {
  status?: number;
  kind?: ApiErrorKind;
  code?: string;
  hint?: string;
  requestId?: string;
  fieldErrors?: Record<string, string[]>;
  cause?: unknown;
}

export class ApiError extends Error {
  status: number;
  kind: ApiErrorKind;
  code?: string;
  hint?: string;
  requestId?: string;
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, options: number | ApiErrorOptions = {}, extra?: { code?: string; hint?: string }) {
    const normalized = typeof options === 'number'
      ? { status: options, code: extra?.code, hint: extra?.hint }
      : options;
    super(message, normalized.cause ? { cause: normalized.cause } : undefined);
    this.name = 'ApiError';
    this.status = normalized.status ?? 0;
    this.kind = normalized.kind ?? 'api';
    this.code = normalized.code;
    this.hint = normalized.hint;
    this.requestId = normalized.requestId;
    this.fieldErrors = normalized.fieldErrors;
  }
}

export function setAdminCsrfToken(token: string | null): void {
  adminCsrfToken = token;
}

/** @deprecated Sessions are stored in HttpOnly cookies. */
export function getAdminToken(): null { return null; }

/** @deprecated Removes tokens created by releases before cookie sessions. */
export function setAdminToken(_token: string | null): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.removeItem(LEGACY_ADMIN_TOKEN_STORAGE_KEY); } catch {}
}

/** @deprecated Session presence must be verified with /admin/session. */
export function hasAdminToken(): boolean { return false; }

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  return withRetry(() => requestOnce<T>(path, opts), opts);
}

export async function withRetry<T>(
  request: () => Promise<T>,
  opts: Pick<ApiOptions, 'method' | 'retry' | 'retryDelayMs' | 'signal'> = {},
): Promise<T> {
  const method = opts.method || 'GET';
  const maxRetries = method === 'GET' ? (opts.retry ?? 2) : 0;
  let attempt = 0;
  while (true) {
    try {
      return await request();
    } catch (error) {
      const apiError = toApiError(error);
      if (attempt >= maxRetries || !isRetryable(apiError, method) || opts.signal?.aborted) throw apiError;
      attempt += 1;
      await wait((opts.retryDelayMs ?? 120) * attempt, opts.signal);
    }
  }
}

async function requestOnce<T>(path: string, opts: ApiOptions): Promise<T> {
  const method = opts.method || 'GET';
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.auth && method !== 'GET' && adminCsrfToken) headers['X-CSRF-Token'] = adminCsrfToken;
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (error) {
    if (isAbortError(error) || opts.signal?.aborted) {
      throw new ApiError('Request was cancelled', { status: 0, kind: 'abort', cause: error });
    }
    throw new ApiError('Could not connect to the API', {
      status: 0, kind: 'network', code: 'NETWORK_ERROR', hint: 'Check your connection and try again.', cause: error,
    });
  }
  const payload = await parsePayload(response);
  const options: ApiErrorOptions = {
    status: response.status,
    kind: response.ok ? 'api' : 'http',
    code: getPayloadField(payload, 'code'),
    hint: getPayloadField(payload, 'hint'),
    requestId: getPayloadField(payload, 'requestId'),
    fieldErrors: getPayloadFieldErrors(payload),
  };
  if (!response.ok) throw new ApiError(getPayloadError(payload) || `Request failed with status ${response.status}`, options);
  if (payload.success === false) throw new ApiError(getPayloadError(payload) || 'Request failed', options);
  return payload.data as T;
}

async function parsePayload(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text) throw new ApiError('Malformed response from server', { status: response.status, kind: 'parse', code: 'BAD_JSON' });
  try {
    const payload = JSON.parse(text);
    if (!payload || typeof payload !== 'object') throw new Error('Expected object payload');
    return payload as Record<string, unknown>;
  } catch (error) {
    throw new ApiError('Malformed response from server', { status: response.status, kind: 'parse', code: 'BAD_JSON', cause: error });
  }
}

function getPayloadError(payload: Record<string, unknown>): string | undefined {
  if (typeof payload.error === 'string') return payload.error;
  if (payload.error && typeof payload.error === 'object') {
    const message = (payload.error as Record<string, unknown>).message;
    return typeof message === 'string' ? message : undefined;
  }
  return undefined;
}

function getPayloadField(payload: Record<string, unknown>, key: 'code' | 'hint' | 'requestId'): string | undefined {
  if (typeof payload[key] === 'string') return String(payload[key]);
  if (payload.error && typeof payload.error === 'object') {
    const value = (payload.error as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

function getPayloadFieldErrors(payload: Record<string, unknown>): Record<string, string[]> | undefined {
  const value = payload.fieldErrors;
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, string[]>
    : undefined;
}

function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError('Request failed', { status: 0, kind: 'network', cause: error });
}

function isRetryable(error: ApiError, method: ApiMethod): boolean {
  return method === 'GET' && (error.kind === 'network' || (error.kind === 'http' && error.status >= 500));
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      globalThis.clearTimeout(timer);
      reject(new ApiError('Request was cancelled', { status: 0, kind: 'abort' }));
    }, { once: true });
  });
}
