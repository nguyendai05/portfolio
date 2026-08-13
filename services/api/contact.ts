import { api } from './client';
import type { ContactMessage } from './types';

export interface ContactMessagePage {
  items: ContactMessage[];
  pageInfo: { nextCursor: string | null };
}

export async function fetchContactMessagesPage(cursor?: string): Promise<ContactMessagePage> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const result = await api<ContactMessagePage | ContactMessage[]>(`/contact-messages${query}`, { auth: true });
  return Array.isArray(result) ? { items: result, pageInfo: { nextCursor: null } } : result;
}

export async function fetchContactMessages(cursor?: string): Promise<ContactMessage[]> {
  return (await fetchContactMessagesPage(cursor)).items;
}

export async function updateContactStatus(
  id: number,
  status: 'new' | 'replied' | 'archived',
): Promise<ContactMessage> {
  return api<ContactMessage>(`/contact-messages/${id}`, {
    method: 'PATCH',
    body: { status },
    auth: true,
  });
}

export async function deleteContactMessage(id: number): Promise<void> {
  await api(`/contact-messages/${id}`, { method: 'DELETE', auth: true });
}

export async function resendContactMessage(id: number): Promise<{ messageId: number; delivery: ContactMessage['delivery'] }> {
  return api(`/contact-messages/${id}/resend`, { method: 'POST', auth: true });
}

export type { ContactMessage };
