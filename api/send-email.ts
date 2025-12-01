import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- Types ---
interface ContactFormData {
  name: string;
  email: string;
  topic: string;
  message: string;
}

interface EmailPayload {
  service_id: string;
  template_id: string;
  user_id: string;
  template_params: Record<string, unknown>;
}

// --- Constants ---
const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const MAX_AUTO_REPLY_COUNT = 3;
const DEFAULT_MESSAGE = 'Vui lòng không trả lời mail này';
const FINAL_WARNING_MESSAGE = 'I have received a considerable number of requests from you today, and I will do my best to address them one by one. If you have any new requests, please kindly try again tomorrow.';

// In-memory storage (sẽ reset khi function cold start - dùng database cho production)
const emailHistory: Record<string, { count: number }> = {};

// --- Helper Functions ---
function parseEnvList(envValue: string | undefined): string[] {
  if (!envValue) return [];
  return envValue.split(',').map((s) => s.trim()).filter(Boolean);
}

function getRotationIndex(): number {
  const publicKeys = parseEnvList(process.env.EMAILJS_PUBLIC_KEY);
  const totalConfigs = publicKeys.length;
  if (totalConfigs === 0) return 0;
  
  // Rotate dựa trên thời gian (mỗi 10 phút)
  const tenMinutes = 10 * 60 * 1000;
  return Math.floor(Date.now() / tenMinutes) % totalConfigs;
}

function getCurrentConfig() {
  const publicKeys = parseEnvList(process.env.EMAILJS_PUBLIC_KEY);
  const serviceIds = parseEnvList(process.env.EMAILJS_SERVICE_ID);
  const contactIds = parseEnvList(process.env.EMAILJS_CONTACT_ID);
  const autoReplyIds = parseEnvList(process.env.EMAILJS_AUTO_REPLY_ID);

  if (publicKeys.length === 0) {
    return null;
  }

  const index = getRotationIndex();
  const number = index + 1;

  return {
    serviceId: serviceIds[index] || `service_xunidizan_${number}`,
    contactTemplateId: contactIds[index] || `contact_xunidizan_${number}`,
    autoReplyTemplateId: autoReplyIds[index] || `reply_xunidizan_${number}`,
    publicKey: publicKeys[index],
  };
}


async function sendEmailJS(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    console.log('Sending email with payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(EMAILJS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const responseText = await response.text();
    console.log('EmailJS response:', response.status, responseText);
    
    if (!response.ok) {
      return { ok: false, error: responseText };
    }
    return { ok: true };
  } catch (error) {
    console.error('EmailJS fetch error:', error);
    return { ok: false, error: String(error) };
  }
}

function getEmailCount(email: string): number {
  return emailHistory[email.toLowerCase()]?.count || 0;
}

function incrementEmailCount(email: string): void {
  const key = email.toLowerCase();
  if (!emailHistory[key]) {
    emailHistory[key] = { count: 0 };
  }
  emailHistory[key].count += 1;
}

function isEmailBlocked(email: string): boolean {
  return getEmailCount(email) >= MAX_AUTO_REPLY_COUNT;
}

// --- Main Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const config = getCurrentConfig();
  if (!config) {
    return res.status(500).json({ success: false, error: 'Email service not configured' });
  }

  const data: ContactFormData = req.body;

  // Validate
  if (!data.name || !data.email || !data.message) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Check blocked
  if (isEmailBlocked(data.email)) {
    return res.status(429).json({ 
      success: false, 
      blocked: true, 
      error: 'This email has reached the maximum submission limit.' 
    });
  }

  const currentCount = getEmailCount(data.email);
  const isFinalWarning = currentCount === MAX_AUTO_REPLY_COUNT - 1;

  const timestamp = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const topicCapitalized = data.topic.charAt(0).toUpperCase() + data.topic.slice(1);

  try {
    console.log('Using config:', config);

    // 1. Send contact notification
    const contactPayload: EmailPayload = {
      service_id: config.serviceId,
      template_id: config.contactTemplateId,
      user_id: config.publicKey,
      template_params: {
        from_name: data.name,
        from_email: data.email,
        topic: topicCapitalized,
        message: data.message,
        timestamp,
      },
    };
    const contactResult = await sendEmailJS(contactPayload);
    
    if (!contactResult.ok) {
      console.error('Contact email failed:', contactResult.error);
      return res.status(500).json({ success: false, error: `Contact email failed: ${contactResult.error}` });
    }

    // 2. Send auto-reply
    let autoReplySent = false;
    const autoReplyPayload: EmailPayload = {
      service_id: config.serviceId,
      template_id: config.autoReplyTemplateId,
      user_id: config.publicKey,
      template_params: {
        name: data.name,
        email: data.email,
        title: topicCapitalized,
        extra_message: isFinalWarning ? FINAL_WARNING_MESSAGE : DEFAULT_MESSAGE,
      },
    };
    const replyResult = await sendEmailJS(autoReplyPayload);
    autoReplySent = replyResult.ok;
    
    if (!replyResult.ok) {
      console.warn('Auto-reply failed:', replyResult.error);
    }

    // Increment count
    incrementEmailCount(data.email);

    return res.status(200).json({ success: true, autoReplySent });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send email' });
  }
}
