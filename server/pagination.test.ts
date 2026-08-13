import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor, parsePageLimit } from './pagination';

describe('cursor pagination', () => {
  it('round-trips a stable createdAt/id cursor', () => {
    const cursor = encodeCursor({ createdAt: '2026-08-13T10:00:00.000Z', id: 42 });
    expect(decodeCursor(cursor)).toEqual({ createdAt: '2026-08-13T10:00:00.000Z', id: 42 });
  });

  it('rejects malformed or unsafe cursors', () => {
    expect(decodeCursor('not-a-cursor')).toBeNull();
    expect(decodeCursor(Buffer.from(JSON.stringify({ createdAt: 'bad', id: -1 })).toString('base64url'))).toBeNull();
  });

  it('bounds page size', () => {
    expect(parsePageLimit(undefined)).toBe(20);
    expect(parsePageLimit('200')).toBe(100);
    expect(parsePageLimit('0')).toBe(20);
  });
});
