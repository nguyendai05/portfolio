// --- Types ---
export interface ContactFormData {
  name: string;
  email: string;
  topic: 'collaboration' | 'mentorship' | 'freelance' | 'other';
  message: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
  autoReplySent?: boolean;
  blocked?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// --- Constants ---
const EMAIL_HISTORY_STORAGE_KEY = 'portfolio_email_history';
const MAX_TOTAL_SUBMISSIONS = 3;
const API_ENDPOINT = '/api/send-email';

interface EmailHistoryEntry {
  count: number;
}

// --- Email History Management (client-side backup) ---
function getEmailHistory(): Record<string, EmailHistoryEntry> {
  try {
    return JSON.parse(localStorage.getItem(EMAIL_HISTORY_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveEmailHistory(history: Record<string, EmailHistoryEntry>): void {
  try {
    localStorage.setItem(EMAIL_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {}
}

function getEmailEntry(email: string): EmailHistoryEntry {
  const history = getEmailHistory();
  return history[email.toLowerCase()] || { count: 0 };
}

function incrementEmailCount(email: string): void {
  const history = getEmailHistory();
  const entry = history[email.toLowerCase()] || { count: 0 };
  entry.count += 1;
  history[email.toLowerCase()] = entry;
  saveEmailHistory(history);
}

// --- Validation ---
export function validateContactForm(data: ContactFormData): ValidationResult {
  const errors: string[] = [];
  if (!data.name || data.name.trim() === '') errors.push('Name is required');
  if (!data.email || data.email.trim() === '') errors.push('Email is required');
  if (!data.message || data.message.trim() === '') errors.push('Message is required');
  return { isValid: errors.length === 0, errors };
}

/**
 * Kiểm tra email có bị block không (đã gửi >= 3 lần)
 */
export function isEmailBlocked(email: string): boolean {
  const entry = getEmailEntry(email);
  return entry.count >= MAX_TOTAL_SUBMISSIONS;
}

/**
 * Gửi contact email qua API serverless
 * - Lần 1-2: Contact + Auto-reply bình thường
 * - Lần 3: Contact + Auto-reply với cảnh báo
 * - Lần 4+: Bị block
 */
export async function sendContactEmail(data: ContactFormData): Promise<EmailResult> {
  // Check client-side block first
  if (isEmailBlocked(data.email)) {
    return {
      success: false,
      blocked: true,
      error: 'This email has reached the maximum submission limit.',
    };
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      // Sync client-side count
      incrementEmailCount(data.email);
    }

    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}
