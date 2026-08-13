import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export function initializeRequestContext(req: VercelRequest, res: VercelResponse): string {
  const incoming = req.headers['x-request-id'];
  const requestId = typeof incoming === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(incoming)
    ? incoming
    : crypto.randomUUID();
  (req as VercelRequest & { requestId?: string }).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  const original = res.json.bind(res);
  res.json = ((payload: unknown) => {
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const record = payload as Record<string, unknown>;
      if (typeof record.code === 'string') {
        (req as VercelRequest & { responseCode?: string }).responseCode = record.code;
      }
      return original({ ...record, requestId });
    }
    return original(payload);
  }) as typeof res.json;
  return requestId;
}

export function getRequestId(req: VercelRequest): string {
  return (req as VercelRequest & { requestId?: string }).requestId || 'unknown';
}

export function getResponseCode(req: VercelRequest): string | undefined {
  return (req as VercelRequest & { responseCode?: string }).responseCode;
}

export function logRequest(event: {
  requestId: string;
  method?: string;
  path: string;
  status: number;
  durationMs: number;
  code?: string;
}): void {
  console.info(JSON.stringify({ type: 'request', ...event }));
}
