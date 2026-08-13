export interface CursorValue {
  createdAt: string;
  id: number;
}

export function encodeCursor(value: CursorValue): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function decodeCursor(value: string | undefined): CursorValue | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as CursorValue;
    if (!parsed.createdAt || Number.isNaN(Date.parse(parsed.createdAt)) || !Number.isInteger(parsed.id) || parsed.id <= 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function parsePageLimit(raw: string | undefined, fallback = 20, maximum = 100): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) return fallback;
  return Math.min(value, maximum);
}
