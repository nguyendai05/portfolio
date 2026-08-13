import { describe, expect, it } from 'vitest';
import { aiChatSchema, contactSchema, projectCreateSchema } from './validation';

describe('API boundary validation', () => {
  it('strips unknown public fields but normalizes contact email', () => {
    const value = contactSchema.parse({
      name: ' User ', email: 'USER@EXAMPLE.COM', topic: 'other', message: 'Hello', injected: 'drop-me',
    });
    expect(value).toEqual({ name: 'User', email: 'user@example.com', topic: 'other', message: 'Hello' });
  });

  it('rejects AI requests above the total history budget', () => {
    const result = aiChatSchema.safeParse({
      message: 'x'.repeat(1000),
      history: Array.from({ length: 6 }, () => ({ role: 'user', parts: [{ text: 'y'.repeat(1000) }] })),
    });
    expect(result.success).toBe(false);
  });

  it('keeps admin project schemas strict and permits only http protocols', () => {
    const base = {
      title: 'Project', description: 'Description', category: 'Web', imageUrl: 'https://example.com/image.jpg',
    };
    expect(projectCreateSchema.safeParse({ ...base, unexpected: true }).success).toBe(false);
    expect(projectCreateSchema.safeParse({ ...base, imageUrl: 'javascript:alert(1)' }).success).toBe(false);
  });
});
