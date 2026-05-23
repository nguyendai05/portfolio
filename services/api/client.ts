const API_BASE = '/api';
const ADMIN_TOKEN_STORAGE_KEY = 'xuni_admin_token';

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

export class ApiError extends Error {
  status: number;
  kind: ApiErrorKind;
  code?: string;
  hint?: string;

  constructor(
    message: string,
    statusOrOptions:
      | number
      | {
          status?: number;
          kind?: ApiErrorKind;
          code?: string;
          hint?: string;
          cause?: unknown;
        } = {},
    extra?: { code?: string; hint?: string },
  ) {
    const options =
      typeof statusOrOptions === 'number'
        ? { status: statusOrOptions, code: extra?.code, hint: extra?.hint }
        : statusOrOptions;
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.kind = options.kind ?? 'api';
    this.code = options.code;
    this.hint = options.hint;
  }
}

export function getAdminToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    }
  } catch {
    // localStorage can fail in restricted browser contexts.
  }
}

export function hasAdminToken(): boolean {
  return Boolean(getAdminToken());
}

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

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await request();
    } catch (error) {
      const apiError = toApiError(error);
      if (attempt >= maxRetries || !isRetryable(apiError, method) || opts.signal?.aborted) {
        throw apiError;
      }
      attempt += 1;
      await wait((opts.retryDelayMs ?? 120) * attempt, opts.signal);
    }
  }
}

async function requestOnce<T>(path: string, opts: ApiOptions): Promise<T> {
  const method = opts.method || 'GET';
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (opts.auth) {
    const token = getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (error) {
    if (isAbortError(error) || opts.signal?.aborted) {
      throw new ApiError('Request was cancelled', { status: 0, kind: 'abort', cause: error });
    }
    throw new ApiError('Could not connect to the API', {
      status: 0,
      kind: 'network',
      code: 'NETWORK_ERROR',
      hint: 'Check your connection and try again.',
      cause: error,
    });
  }

  const payload = await parsePayload(response);
  if (!response.ok) {
    throw new ApiError(getPayloadError(payload) || `Request failed with status ${response.status}`, {
      status: response.status,
      kind: 'http',
      code: getPayloadField(payload, 'code'),
      hint: getPayloadField(payload, 'hint'),
    });
  }

  if (payload.success === false) {
    throw new ApiError(getPayloadError(payload) || 'Request failed', {
      status: response.status,
      kind: 'api',
      code: getPayloadField(payload, 'code'),
      hint: getPayloadField(payload, 'hint'),
    });
  }

  return payload.data as T;
}

async function parsePayload(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text) {
    throw new ApiError('Malformed response from server', {
      status: response.status,
      kind: 'parse',
      code: 'BAD_JSON',
    });
  }
  try {
    const payload = JSON.parse(text);
    if (!payload || typeof payload !== 'object') {
      throw new Error('Expected object payload');
    }
    return payload as Record<string, unknown>;
  } catch (error) {
    throw new ApiError('Malformed response from server', {
      status: response.status,
      kind: 'parse',
      code: 'BAD_JSON',
      cause: error,
    });
  }
}

function getPayloadError(payload: Record<string, unknown>): string | undefined {
  return typeof payload.error === 'string' ? payload.error : undefined;
}

function getPayloadField(payload: Record<string, unknown>, key: 'code' | 'hint'): string | undefined {
  return typeof payload[key] === 'string' ? String(payload[key]) : undefined;
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError('Request failed', { status: 0, kind: 'network', cause: error });
}

function isRetryable(error: ApiError, method: ApiMethod): boolean {
  if (method !== 'GET') return false;
  if (error.kind === 'network') return true;
  return error.kind === 'http' && error.status >= 500;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        globalThis.clearTimeout(timer);
        reject(new ApiError('Request was cancelled', { status: 0, kind: 'abort' }));
      },
      { once: true },
    );
  });
}
