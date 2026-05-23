import { api } from './client';
import type { ContactMessage } from './types';

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  return api<ContactMessage[]>(`/contact-messages`, { auth: true });
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

export type { ContactMessage };
