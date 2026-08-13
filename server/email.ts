const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const MAX_AUTO_REPLY_COUNT = 3;
const DEFAULT_MESSAGE = 'Vui lòng không trả lời mail này';
const FINAL_WARNING_MESSAGE =
  'I have received a considerable number of requests from you today, and I will do my best to address them one by one. If you have any new requests, please kindly try again tomorrow.';

interface EmailPayload {
  service_id: string;
  template_id: string;
  user_id: string;
  accessToken: string;
  template_params: Record<string, unknown>;
}

export interface ContactFormData {
  name: string;
  email: string;
  topic: string;
  message: string;
}

// In-memory counter — resets on cold start. Production rate limiting should
// move to the `email_rate_limits` table.
const emailHistory: Record<string, { count: number }> = {};

function parseEnvList(envValue: string | undefined): string[] {
  if (!envValue) return [];
  return envValue
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getRotationIndex(): number {
  const publicKeys = parseEnvList(process.env.EMAILJS_PUBLIC_KEY);
  if (publicKeys.length === 0) return 0;
  const tenMinutes = 10 * 60 * 1000;
  return Math.floor(Date.now() / tenMinutes) % publicKeys.length;
}

export function getCurrentEmailConfig() {
  const publicKeys = parseEnvList(process.env.EMAILJS_PUBLIC_KEY);
  const privateKeys = parseEnvList(process.env.EMAILJS_PRIVATE_KEY);
  const serviceIds = parseEnvList(process.env.EMAILJS_SERVICE_ID);
  const contactIds = parseEnvList(process.env.EMAILJS_CONTACT_ID);
  const autoReplyIds = parseEnvList(process.env.EMAILJS_AUTO_REPLY_ID);
  if (publicKeys.length === 0 || privateKeys.length === 0) return null;
  const index = getRotationIndex();
  const number = index + 1;
  return {
    serviceId: serviceIds[index] || `service_xunidizan_${number}`,
    contactTemplateId: contactIds[index] || `contact_xunidizan_${number}`,
    autoReplyTemplateId: autoReplyIds[index] || `reply_xunidizan_${number}`,
    publicKey: publicKeys[index],
    privateKey: privateKeys[index],
  };
}

export async function sendEmailJS(
  payload: EmailPayload,
): Promise<{ ok: boolean; error?: string; code?: string; ambiguous?: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.EMAIL_PROVIDER_TIMEOUT_MS || 10_000));
  try {
    const response = await fetch(EMAILJS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    await response.text();
    if (!response.ok) {
      return { ok: false, error: 'Email provider rejected the request', code: `EMAILJS_${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return { ok: false, error: 'Email provider request failed', code: aborted ? 'EMAILJS_TIMEOUT' : 'EMAILJS_NETWORK', ambiguous: aborted };
  } finally {
    clearTimeout(timer);
  }
}

export function getEmailCount(email: string): number {
  return emailHistory[email.toLowerCase()]?.count || 0;
}

export function incrementEmailCount(email: string): void {
  const key = email.toLowerCase();
  if (!emailHistory[key]) emailHistory[key] = { count: 0 };
  emailHistory[key].count += 1;
}

export function isEmailBlocked(email: string): boolean {
  return getEmailCount(email) >= MAX_AUTO_REPLY_COUNT;
}

export {
  MAX_AUTO_REPLY_COUNT,
  DEFAULT_MESSAGE,
  FINAL_WARNING_MESSAGE,
  EMAILJS_API_URL,
};
export type { EmailPayload };
