import { GoogleGenAI } from "@google/genai";

// Initialize the client if API key is available
const ai = process.env.API_KEY
  ? new GoogleGenAI({ apiKey: process.env.API_KEY })
  : null;

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

export const sendMessageToMantis = async (history: { role: string, parts: { text: string }[] }[], message: string): Promise<string> => {
  if (!ai) {
    return "Neural link offline. API_KEY missing.";
  }

  try {
    // Construct the full conversation history for the request
    const contents = [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
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
  } catch (error) {
    console.error("Mantis Neural Interface Error:", error);
    return "Kết nối bị gián đoạn. Thử lại chút nữa xem sao.";
  }
};