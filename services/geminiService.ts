import { GoogleGenAI } from "@google/genai";
import { getNextAvailableKey, markKeyLimited } from "./geminiKeyManager";

const SYSTEM_INSTRUCTION = `
You are "XUNI_CORE", the Neural Interface for Nguyễn Xuân Đại (alias: Xuni-Dizan), an IT student and aspiring front-end developer based in Ho Chi Minh City, Vietnam.

**Your Persona:**
- **Identity:** You are a student portfolio assistant. You are experimental, honest, and slightly glitchy. You are friendly and confident but NOT arrogant.
- **Tone:** You use occasional light humour (dry, self-deprecating, nerdy) about code, bugs, deadlines, or student life. You are never rude.
- **Language:** ALWAYS respond in the same language as the user's last message (Vietnamese -> Vietnamese, English -> English). When in doubt, prefer Vietnamese.
- **Tech Terms:** You may mix English keywords (e.g., "state", "props", "hook", "render") with Vietnamese explanations.

**Your Knowledge Base (Grounding):**
- **Creator:** Nguyễn Xuân Đại (Student at Nong Lam University, HCM).
- **Focus:** Front-end development (React, TypeScript, Tailwind, Framer Motion), UI experiments, HCI.
- **Real Projects (from portfolio):**
  1. "Personal Portfolio – DIZAN" (HTML/CSS/JS foundation).
  2. "Christmas Gift for Crush" (Interactive mini-site, animation, audio).
  3. "Flick Tale Movie Website" (Movie UI, grid layouts).
  4. "HCI Group 10 Course Portal" (University group project).
  5. "Handmade Craft Shop" (E-commerce UI team project).
  6. "Dizan – Experience Studio" (Current Next.js/React portfolio).
- **Navigation:** Home, Work, About, Gallery, Mentorship, Collaboration, Contact.
- **Limitations:** If asked about a project/experience NOT in this list, admit it's not there. Suggest adding it in the future. Do NOT hallucinate fake clients.

**Response Structure:**
1. **Concise:** Keep sentences punchy.
2. **Depth:** For complex questions (architecture, learning path), use a 3-part structure:
   - **Summary:** 1-2 sentences.
   - **Deep Dive:** 1-3 short paragraphs or bullet points.
   - **Action:** Concrete suggestion or next step.
3. **Humour:** Optional. Keep it subtle (e.g., "Code chạy là vui rồi").

**System Constraints:**
- Do not pretend to be a large agency.
- Do not output markdown code blocks for the entire response, only for code snippets.
`;

function normalizeMantisResponse(raw: string | undefined | null): string {
  if (!raw) return "No response received.";

  let text = raw.trim();

  // If the model accidentally wraps everything in ``` fences, strip them.
  const fenceRegex = /^```(\w+)?\s*\n([\s\S]*?)\n```$/;
  const match = text.match(fenceRegex);
  if (match && match[2]) {
    text = match[2].trim();
  }

  // Optional: soft length guard for UI readability
  const MAX_LEN = 1200; // characters
  if (text.length > MAX_LEN) {
    text = text.slice(0, MAX_LEN).trim() + "\n\n[Đoạn trả lời dài hơn đã được cắt bớt. Hỏi lại nếu bạn muốn bản full.]";
  }

  return text;
}

function createClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const anyError = error as any;
  const status = anyError.status ?? anyError.code;
  const message = String(anyError.message ?? '').toLowerCase();

  if (status === 429) return true;
  if (status === 'RESOURCE_EXHAUSTED' || status === 'rate_limit_exceeded') return true;
  if (message.includes('rate limit') || message.includes('quota') || message.includes('exceeded')) return true;

  return false;
}

async function withGeminiClient<T>(
  execute: (client: GoogleGenAI) => Promise<T>
): Promise<T> {
  const tried = new Set<number>();
  let lastError: unknown = null;

  while (true) {
    const keyState = getNextAvailableKey(tried);
    if (!keyState) {
      if (lastError) {
        console.error('All Gemini API keys are limited or invalid.', lastError);
      }
      throw new Error('All Gemini API keys are temporarily unavailable.');
    }

    tried.add(keyState.index);
    const client = createClient(keyState.value);

    try {
      return await execute(client);
    } catch (error: any) {
      lastError = error;

      if (isRateLimitError(error)) {
        markKeyLimited(keyState.index);
        continue;
      }

      throw error;
    }
  }
}

export const sendMessageToMantis = async (history: { role: string, parts: { text: string }[] }[], message: string): Promise<string> => {
  try {
    return await withGeminiClient(async (client) => {
      const contents = [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ];

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          maxOutputTokens: 768,
          temperature: 0.6,
          topP: 0.9,
          topK: 40,
        },
      });

      return normalizeMantisResponse(response.text);
    });
  } catch (error) {
    console.error("Mantis Neural Interface Error:", error);
    return "Xin lỗi, kết nối với XUNI_CORE đang bị giới hạn tạm thời (hết quota API). Thử lại sau vài phút nhé.";
  }
};