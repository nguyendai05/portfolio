import { api } from './client';

export interface AiHistoryItem {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export async function sendAiMessage(
  history: AiHistoryItem[],
  message: string,
  signal?: AbortSignal,
): Promise<string> {
  const result = await api<{ text: string }>('/ai/chat', {
    method: 'POST',
    body: { history: history.slice(-8), message },
    signal,
  });
  return result.text;
}
