import emailjs from '@emailjs/browser';

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
const DEFAULT_MESSAGE = 'Vui lòng không trả lời mail này';
const FINAL_WARNING_MESSAGE = 'I have received a considerable number of requests from you today, and I will do my best to address them one by one. If you have any new requests, please kindly try again tomorrow.';

interface EmailHistoryEntry {
  count: number;
}

// --- Email History Management ---
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

export function isEmailBlocked(email: string): boolean {
  const entry = getEmailEntry(email);
  return entry.count >= MAX_TOTAL_SUBMISSIONS;
}

// --- Dev mode: Direct EmailJS ---
function parseEnvList(envValue: string | undefined): string[] {
  if (!envValue) return [];
  return envValue.split(',').map(s => s.trim()).filter(Boolean);
}

function getDevConfig() {
  const publicKeys = parseEnvList(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
  const serviceIds = parseEnvList(import.meta.env.VITE_EMAILJS_SERVICE_ID);
  const contactIds = parseEnvList(import.meta.env.VITE_EMAILJS_CONTACT_ID);
  const autoReplyIds = parseEnvList(import.meta.env.VITE_EMAILJS_AUTO_REPLY_ID);

  if (publicKeys.length === 0) return null;

  const index = Math.floor(Date.now() / (10 * 60 * 1000)) % publicKeys.length;
  const number = index + 1;

  return {
    serviceId: serviceIds[index] || `service_xunidizan_${number}`,
    contactTemplateId: contactIds[index] || `contact_xunidizan_${number}`,
    autoReplyTemplateId: autoReplyIds[index] || `reply_xunidizan_${number}`,
    publicKey: publicKeys[index],
  };
}

async function sendEmailDev(data: ContactFormData): Promise<EmailResult> {
  const config = getDevConfig();
  if (!config) {
    return { success: false, error: 'Email service not configured for dev mode.' };
  }

  const emailEntry = getEmailEntry(data.email);
  const isFinalWarning = emailEntry.count === MAX_TOTAL_SUBMISSIONS - 1;

  const timestamp = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  try {
    // Send contact notification
    await emailjs.send(config.serviceId, config.contactTemplateId, {
      from_name: data.name,
      from_email: data.email,
      topic: data.topic.charAt(0).toUpperCase() + data.topic.slice(1),
      message: data.message,
      timestamp,
    }, config.publicKey);

    // Send auto-reply
    let autoReplySent = false;
    try {
      await emailjs.send(config.serviceId, config.autoReplyTemplateId, {
        name: data.name,
        email: data.email,
        title: data.topic.charAt(0).toUpperCase() + data.topic.slice(1),
        extra_message: isFinalWarning ? FINAL_WARNING_MESSAGE : DEFAULT_MESSAGE,
      }, config.publicKey);
      autoReplySent = true;
    } catch {}

    incrementEmailCount(data.email);
    return { success: true, autoReplySent };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email.',
    };
  }
}

// --- Main Function ---
export async function sendContactEmail(data: ContactFormData): Promise<EmailResult> {
  if (isEmailBlocked(data.email)) {
    return {
      success: false,
      blocked: true,
      error: 'This email has reached the maximum submission limit.',
    };
  }

  // Dev mode: use direct EmailJS
  if (import.meta.env.DEV) {
    return sendEmailDev(data);
  }

  // Production: use API endpoint
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
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
