export interface ContactFormData {
  name: string;
  email: string;
  topic: 'collaboration' | 'mentorship' | 'freelance' | 'other';
  message: string;
}

export type ContactDelivery = 'pending' | 'processing' | 'sent' | 'failed' | 'unknown';

export interface EmailResult {
  success: boolean;
  error?: string;
  blocked?: boolean;
  messageId?: number;
  delivery?: ContactDelivery;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactForm(data: ContactFormData): ValidationResult {
  const errors: string[] = [];
  const name = data.name.trim();
  const email = data.email.trim();
  const message = data.message.trim();
  if (!name) errors.push('Name is required');
  else if (name.length > 100) errors.push('Name is too long');
  if (!email) errors.push('Email is required');
  else if (!EMAIL_PATTERN.test(email) || email.length > 255) errors.push('Email is invalid');
  if (!message) errors.push('Message is required');
  else if (message.length > 5000) errors.push('Message is too long');
  return { isValid: errors.length === 0, errors };
}

// Kept as a compatibility UX hint. The server is the authority for blocking.
export function isEmailBlocked(_email?: string): boolean {
  return false;
}

export async function sendContactEmail(data: ContactFormData): Promise<EmailResult> {
  const validation = validateContactForm(data);
  if (!validation.isValid) return { success: false, error: validation.errors[0] };
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(data),
    });
    const payload = await response.json() as {
      success?: boolean;
      error?: string;
      code?: string;
      data?: { messageId?: number; delivery?: ContactDelivery };
    };
    if (!response.ok || payload.success === false) {
      return {
        success: false,
        blocked: response.status === 429,
        error: payload.error || 'Failed to send message.',
      };
    }
    return {
      success: true,
      messageId: payload.data?.messageId,
      delivery: payload.data?.delivery,
    };
  } catch {
    return { success: false, error: 'Network error. Please check your connection and try again.' };
  }
}
